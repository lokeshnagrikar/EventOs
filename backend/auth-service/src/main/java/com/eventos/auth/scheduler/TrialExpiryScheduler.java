package com.eventos.auth.scheduler;

import com.eventos.auth.entity.Membership;
import com.eventos.auth.entity.Subscription;
import com.eventos.auth.entity.Tenant;
import com.eventos.auth.entity.User;
import com.eventos.auth.repository.MembershipRepository;
import com.eventos.auth.repository.SubscriptionRepository;
import com.eventos.auth.repository.TenantRepository;
import com.eventos.auth.service.AuditLogService;
import com.eventos.auth.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@SuppressWarnings("null")
public class TrialExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(TrialExpiryScheduler.class);

    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final MembershipRepository membershipRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @Autowired(required = false)
    private StringRedisTemplate stringRedisTemplate;

    private final Map<String, Long> localDeduplicationCache = new ConcurrentHashMap<>();

    public TrialExpiryScheduler(
            SubscriptionRepository subscriptionRepository,
            TenantRepository tenantRepository,
            MembershipRepository membershipRepository,
            EmailService emailService,
            AuditLogService auditLogService) {
        this.subscriptionRepository = subscriptionRepository;
        this.tenantRepository = tenantRepository;
        this.membershipRepository = membershipRepository;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    /**
     * Daily morning execution at 09:00 AM server time.
     * Evaluates all active trial subscriptions, dispatches reminder emails at 3-days and 1-day remaining,
     * and automatically concludes/expires trials exceeding 14 days.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void evaluateTrialSubscriptions() {
        log.info("[TRIAL_SCHEDULER] Starting automated 14-day trial lifecycle evaluation...");
        try {
            List<Subscription> trialingList = subscriptionRepository.findByStatusIgnoreCase("TRIALING");
            if (trialingList == null || trialingList.isEmpty()) {
                log.info("[TRIAL_SCHEDULER] No workspaces currently in TRIALING status.");
                return;
            }

            LocalDateTime now = LocalDateTime.now();
            int remindersSent = 0;
            int expiredCount = 0;

            for (Subscription sub : trialingList) {
                if (sub.getTrialEnd() == null) continue;

                UUID tenantId = sub.getTenantId();
                Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
                String wsName = tenant != null ? tenant.getName() : "Your Workspace";

                // Locate Workspace Owner
                Optional<Membership> ownerMembership = membershipRepository.findByTenantId(tenantId).stream()
                        .filter(m -> "OWNER".equalsIgnoreCase(m.getRole().getName()))
                        .findFirst();

                if (ownerMembership.isEmpty() || ownerMembership.get().getUser() == null) {
                    continue;
                }

                User owner = ownerMembership.get().getUser();
                String ownerEmail = owner.getEmail();
                String ownerName = owner.getFirstName() + (owner.getLastName() != null ? " " + owner.getLastName() : "");

                if (now.isAfter(sub.getTrialEnd())) {
                    // Trial has officially completed and expired
                    sub.setStatus("EXPIRED");
                    subscriptionRepository.save(sub);

                    if (tenant != null) {
                        tenant.setSubscriptionStatus("EXPIRED");
                        tenantRepository.save(tenant);
                    }

                    auditLogService.logEvent(tenantId, null, "TRIAL_EXPIRED", "127.0.0.1", "System",
                            "14-Day Free Trial period ended. Account marked EXPIRED.");

                    String lockKey = "trial:email:expired:" + tenantId;
                    if (shouldSendEmail(lockKey)) {
                        emailService.sendTrialExpiredEmail(ownerEmail, ownerName, wsName);
                        markEmailSent(lockKey, 30);
                    }
                    expiredCount++;
                } else {
                    // Calculate remaining days
                    long hoursLeft = Duration.between(now, sub.getTrialEnd()).toHours();
                    long daysLeft = (hoursLeft + 23) / 24;

                    if (daysLeft <= 1) {
                        String lockKey = "trial:email:reminder:1d:" + tenantId;
                        if (shouldSendEmail(lockKey)) {
                            emailService.sendTrialReminderEmail(ownerEmail, ownerName, wsName, 1);
                            markEmailSent(lockKey, 7);
                            remindersSent++;
                        }
                    } else if (daysLeft <= 3) {
                        String lockKey = "trial:email:reminder:3d:" + tenantId;
                        if (shouldSendEmail(lockKey)) {
                            emailService.sendTrialReminderEmail(ownerEmail, ownerName, wsName, (int) daysLeft);
                            markEmailSent(lockKey, 7);
                            remindersSent++;
                        }
                    }
                }
            }

            log.info("[TRIAL_SCHEDULER] Evaluation complete. Expired: {}, Reminders Dispatched: {}", expiredCount, remindersSent);
        } catch (Exception e) {
            log.error("[TRIAL_SCHEDULER_ERR] Error during trial subscription evaluation: {}", e.getMessage(), e);
        }
    }

    private boolean shouldSendEmail(String key) {
        if (stringRedisTemplate != null) {
            try {
                Boolean exists = stringRedisTemplate.hasKey(key);
                return !Boolean.TRUE.equals(exists);
            } catch (Exception ignored) {}
        }
        Long expiry = localDeduplicationCache.get(key);
        return expiry == null || System.currentTimeMillis() > expiry;
    }

    private void markEmailSent(String key, int daysValid) {
        if (stringRedisTemplate != null) {
            try {
                stringRedisTemplate.opsForValue().set(key, "SENT", Duration.ofDays(daysValid));
                return;
            } catch (Exception ignored) {}
        }
        localDeduplicationCache.put(key, System.currentTimeMillis() + (daysValid * 24L * 3600L * 1000L));
    }
}
