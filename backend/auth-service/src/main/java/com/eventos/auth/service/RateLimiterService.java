package com.eventos.auth.service;

import com.eventos.auth.exception.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;

@Service
@SuppressWarnings("null")
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);

    /**
     * Truly atomic Redis rate limiting script:
     * 1. Atomically increments counter.
     * 2. If first request or key has no TTL (-1), sets expiration atomically.
     * 3. Returns {currentCount, remainingTTL}.
     * Process crash or network disruption cannot leave a key without TTL.
     */
    private static final String RATE_LIMIT_LUA_SCRIPT =
            "local current = redis.call('INCR', KEYS[1])\n" +
            "local ttl = redis.call('TTL', KEYS[1])\n" +
            "if ttl == -1 or current == 1 then\n" +
            "    redis.call('EXPIRE', KEYS[1], ARGV[1])\n" +
            "    ttl = tonumber(ARGV[1])\n" +
            "end\n" +
            "return {current, ttl}";

    private final RedisScript<List> rateLimitScript = new DefaultRedisScript<>(RATE_LIMIT_LUA_SCRIPT, List.class);

    private final StringRedisTemplate stringRedisTemplate;

    @Autowired(required = false)
    private Environment environment;

    @Value("${app.rate-limiting.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limiting.login.ip-limit:10}")
    private int loginIpLimit;

    @Value("${app.rate-limiting.login.ip-window-seconds:900}")
    private long loginIpWindowSeconds;

    @Value("${app.rate-limiting.login.account-limit:5}")
    private int loginAccountLimit;

    @Value("${app.rate-limiting.login.superadmin-account-limit:3}")
    private int loginSuperAdminAccountLimit;

    @Value("${app.rate-limiting.login.account-window-seconds:900}")
    private long loginAccountWindowSeconds;

    @Value("${app.rate-limiting.password-reset.ip-limit:5}")
    private int passwordResetIpLimit;

    @Value("${app.rate-limiting.password-reset.ip-window-seconds:3600}")
    private long passwordResetIpWindowSeconds;

    @Value("${app.rate-limiting.password-reset.account-limit:3}")
    private int passwordResetAccountLimit;

    @Value("${app.rate-limiting.password-reset.account-window-seconds:3600}")
    private long passwordResetAccountWindowSeconds;

    @Value("${app.rate-limiting.otp.limit:5}")
    private int otpLimit;

    @Value("${app.rate-limiting.otp.window-seconds:900}")
    private long otpWindowSeconds;

    @Value("${app.rate-limiting.otp.verify-limit:5}")
    private int otpVerifyLimit;

    @Value("${app.rate-limiting.otp.verify-window-seconds:900}")
    private long otpVerifyWindowSeconds;

    @Value("${app.rate-limiting.magic-link.limit:5}")
    private int magicLinkLimit;

    @Value("${app.rate-limiting.magic-link.window-seconds:3600}")
    private long magicLinkWindowSeconds;

    public RateLimiterService(@Autowired(required = false) StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public boolean isProductionProfile() {
        if (environment != null) {
            for (String profile : environment.getActiveProfiles()) {
                if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                    return true;
                }
            }
        }
        String sysProfile = System.getProperty("spring.profiles.active");
        if (sysProfile != null && ("prod".equalsIgnoreCase(sysProfile) || "production".equalsIgnoreCase(sysProfile))) {
            return true;
        }
        String envProfile = System.getenv("SPRING_PROFILES_ACTIVE");
        return envProfile != null && ("prod".equalsIgnoreCase(envProfile) || "production".equalsIgnoreCase(envProfile));
    }

    public void checkLoginRateLimit(String ipAddress, String email) {
        checkLoginRateLimit(ipAddress, email, false);
    }

    public void checkLoginRateLimit(String ipAddress, String email, boolean isSuperAdmin) {
        if (!enabled || stringRedisTemplate == null) {
            return;
        }

        // 1. IP-level check
        if (ipAddress != null && !ipAddress.trim().isEmpty()) {
            String ipKey = "rate:limit:auth:login:ip:" + ipAddress.trim();
            checkRateLimit(ipKey, loginIpLimit, loginIpWindowSeconds, "LOGIN_IP");
        }

        // 2. Account-level check (hashed identifier prevents PII in Redis keys)
        // Stricter limit for SuperAdmin accounts (3 attempts vs 5 for regular accounts)
        if (email != null && !email.trim().isEmpty()) {
            int accountLimit = isSuperAdmin ? loginSuperAdminAccountLimit : loginAccountLimit;
            String accountKey = "rate:limit:auth:login:account:" + hashIdentifier(email.trim().toLowerCase());
            checkRateLimit(accountKey, accountLimit, loginAccountWindowSeconds, isSuperAdmin ? "LOGIN_SUPERADMIN_ACCOUNT" : "LOGIN_ACCOUNT");
        }
    }

    public void checkPasswordResetRateLimit(String ipAddress, String email) {
        if (!enabled || stringRedisTemplate == null) {
            return;
        }

        // 1. IP-level check
        if (ipAddress != null && !ipAddress.trim().isEmpty()) {
            String ipKey = "rate:limit:auth:reset:ip:" + ipAddress.trim();
            checkRateLimit(ipKey, passwordResetIpLimit, passwordResetIpWindowSeconds, "PASSWORD_RESET_IP");
        }

        // 2. Account-level check
        if (email != null && !email.trim().isEmpty()) {
            String accountKey = "rate:limit:auth:reset:account:" + hashIdentifier(email.trim().toLowerCase());
            checkRateLimit(accountKey, passwordResetAccountLimit, passwordResetAccountWindowSeconds, "PASSWORD_RESET_ACCOUNT");
        }
    }

    public void checkOtpDispatchRateLimit(String phoneOrIdentifier) {
        if (!enabled || stringRedisTemplate == null || phoneOrIdentifier == null) {
            return;
        }
        String key = "rate:limit:auth:otp:dispatch:" + hashIdentifier(phoneOrIdentifier.trim());
        checkRateLimit(key, otpLimit, otpWindowSeconds, "OTP_DISPATCH");
    }

    public void checkOtpVerifyRateLimit(String phoneOrIdentifier) {
        if (!enabled || stringRedisTemplate == null || phoneOrIdentifier == null) {
            return;
        }
        String key = "rate:limit:auth:otp:verify:" + hashIdentifier(phoneOrIdentifier.trim());
        checkRateLimit(key, otpVerifyLimit, otpVerifyWindowSeconds, "OTP_VERIFY");
    }

    public void checkMagicLinkRateLimit(String email) {
        if (!enabled || stringRedisTemplate == null || email == null) {
            return;
        }
        String key = "rate:limit:auth:magic:" + hashIdentifier(email.trim().toLowerCase());
        checkRateLimit(key, magicLinkLimit, magicLinkWindowSeconds, "MAGIC_LINK");
    }

    public void checkRateLimit(String key, int limit, long windowSeconds, String actionDescription) {
        if (!enabled || stringRedisTemplate == null) {
            return;
        }

        try {
            // Truly atomic execution via Redis Lua script
            List<?> result = stringRedisTemplate.execute(
                    rateLimitScript,
                    Collections.singletonList(key),
                    String.valueOf(windowSeconds)
            );

            if (result != null && result.size() >= 2) {
                Long current = ((Number) result.get(0)).longValue();
                Long ttl = ((Number) result.get(1)).longValue();

                if (current > limit) {
                    long retryAfter = (ttl != null && ttl > 0) ? ttl : windowSeconds;

                    log.warn("[AUTH_RATE_LIMIT_TRIGGERED] Action: {}, Limit: {}, Current: {}, Window: {}s, RetryAfter: {}s",
                            actionDescription, limit, current, windowSeconds, retryAfter);

                    throw new RateLimitExceededException(retryAfter, "Too many requests. Please try again later.");
                }
            }
        } catch (RateLimitExceededException e) {
            throw e;
        } catch (Exception e) {
            // Outage policy:
            // In production, sensitive auth operations fail closed to prevent brute force during outages.
            // In dev/test, fail open so developers and test mocks without Redis proceed smoothly.
            if (isProductionProfile()) {
                log.error("[RATE_LIMIT_OUTAGE_FAIL_CLOSED] Sensitive authentication action blocked during Redis outage in production: Action={}, Key={}, Error={}",
                        actionDescription, key, e.getMessage());
                throw new RateLimitExceededException(60, "SERVICE_UNAVAILABLE", "Authentication service temporarily unavailable. Please try again later.");
            } else {
                log.warn("[RATE_LIMIT_OUTAGE_FAIL_OPEN] Request allowed in non-production environment despite Redis error: Action={}, Error={}",
                        actionDescription, e.getMessage());
            }
        }
    }

    public String hashIdentifier(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
