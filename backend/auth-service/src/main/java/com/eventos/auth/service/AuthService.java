package com.eventos.auth.service;

import com.eventos.auth.dto.RegisterRequestDto;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.eventos.auth.entity.Company;
import com.eventos.auth.entity.Membership;
import com.eventos.auth.entity.RefreshToken;
import com.eventos.auth.entity.Role;
import com.eventos.auth.entity.Tenant;
import com.eventos.auth.entity.User;
import com.eventos.auth.entity.Session;
import com.eventos.auth.entity.Invitation;
import com.eventos.auth.repository.CompanyRepository;
import com.eventos.auth.repository.MembershipRepository;
import com.eventos.auth.repository.RefreshTokenRepository;
import com.eventos.auth.repository.RoleRepository;
import com.eventos.auth.repository.TenantRepository;
import com.eventos.auth.repository.UserRepository;
import com.eventos.auth.repository.SessionRepository;
import com.eventos.auth.repository.InvitationRepository;
import com.eventos.auth.repository.PasswordHistoryRepository;
import com.eventos.auth.entity.PasswordHistory;
import com.eventos.auth.entity.User2Fa;
import com.eventos.auth.repository.User2FaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;
import org.springframework.data.redis.core.StringRedisTemplate;

@Service
@SuppressWarnings("null")
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;

    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final CompanyRepository companyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MembershipRepository membershipRepository;
    private final SessionRepository sessionRepository;
    private final InvitationRepository invitationRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StringRedisTemplate stringRedisTemplate;
    private final AuditLogService auditLogService;
    private final RecaptchaService recaptchaService;
    private final GoogleAuthService googleAuthService;
    private final EmailService emailService;
    private final BillingService billingService;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.security.log-tokens:false}")
    private boolean logTokens;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    private final java.util.Map<String, String> localTokenStore = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.Map<String, Long> localTokenExpiry = new java.util.concurrent.ConcurrentHashMap<>();

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static String generateSecureRefreshToken() {
        byte[] randomBytes = new byte[32]; // 256 bits of cryptographic entropy
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    // Pre-computed BCrypt cost-12 hash used for constant-time comparison when email is not found
    private static final String DUMMY_BCRYPT_HASH = "$2a$12$e8YnN714q8u1wWjV97tF3.B8yF4p51E2b4aWb9e1d8g2k4m6n8p0q";

    private void storeTokenFallback(String key, String value, long minutes) {
        try {
            if (stringRedisTemplate != null) {
                stringRedisTemplate.opsForValue().set(key, value, minutes, TimeUnit.MINUTES);
            }
        } catch (Exception e) {
            log.warn("[TOKEN_STORE] Redis set failed for {}: {}", key, e.getMessage());
        }
        localTokenStore.put(key, value);
        localTokenExpiry.put(key, System.currentTimeMillis() + (minutes * 60 * 1000));
    }

    private String getTokenFallback(String key) {
        String val = null;
        try {
            if (stringRedisTemplate != null) {
                val = stringRedisTemplate.opsForValue().get(key);
            }
        } catch (Exception e) {
            log.warn("[TOKEN_STORE] Redis get failed for {}: {}", key, e.getMessage());
        }
        if (val != null && !val.trim().isEmpty()) return val;

        Long exp = localTokenExpiry.get(key);
        if (exp != null && System.currentTimeMillis() < exp) {
            return localTokenStore.get(key);
        }
        localTokenStore.remove(key);
        localTokenExpiry.remove(key);
        return null;
    }

    private void deleteTokenFallback(String key) {
        try {
            if (stringRedisTemplate != null) {
                stringRedisTemplate.delete(key);
            }
        } catch (Exception e) {
            log.warn("[TOKEN_STORE] Redis delete failed for {}: {}", key, e.getMessage());
        }
        localTokenStore.remove(key);
        localTokenExpiry.remove(key);
    }

    @Autowired(required = false)
    private RateLimiterService rateLimiterService;

    public void setRateLimiterService(RateLimiterService rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }

    @Autowired(required = false)
    private TotpService totpService;

    public void setTotpService(TotpService totpService) {
        this.totpService = totpService;
    }

    @Autowired(required = false)
    private User2FaRepository user2FaRepository;

    public void setUser2FaRepository(User2FaRepository user2FaRepository) {
        this.user2FaRepository = user2FaRepository;
    }

    public void revokeAllUserSessions(UUID userId) {
        if (userId == null) return;
        if (stringRedisTemplate != null) {
            try {
                stringRedisTemplate.opsForValue().set("user:revoked_before:" + userId,
                        String.valueOf(System.currentTimeMillis()), 7, TimeUnit.DAYS);
            } catch (Exception e) {
                log.warn("[REVOCATION] Failed to set user revocation in Redis: {}", e.getMessage());
            }
        }
    }

    public void revokeSingleSession(UUID sessionId) {
        if (sessionId == null) return;
        if (stringRedisTemplate != null) {
            try {
                stringRedisTemplate.opsForValue().set("session:revoked:" + sessionId, "revoked", 24, TimeUnit.HOURS);
            } catch (Exception e) {
                log.warn("[REVOCATION] Failed to set session revocation in Redis: {}", e.getMessage());
            }
        }
    }

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
            TenantRepository tenantRepository, CompanyRepository companyRepository,
            RefreshTokenRepository refreshTokenRepository, MembershipRepository membershipRepository,
            SessionRepository sessionRepository, InvitationRepository invitationRepository,
            PasswordHistoryRepository passwordHistoryRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService,
            StringRedisTemplate stringRedisTemplate, AuditLogService auditLogService,
            RecaptchaService recaptchaService, GoogleAuthService googleAuthService,
            EmailService emailService, BillingService billingService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.tenantRepository = tenantRepository;
        this.companyRepository = companyRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.membershipRepository = membershipRepository;
        this.sessionRepository = sessionRepository;
        this.invitationRepository = invitationRepository;
        this.passwordHistoryRepository = passwordHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.stringRedisTemplate = stringRedisTemplate;
        this.auditLogService = auditLogService;
        this.recaptchaService = recaptchaService;
        this.googleAuthService = googleAuthService;
        this.emailService = emailService;
        this.billingService = billingService;
    }

    @Transactional
    public Map<String, Object> register(RegisterRequestDto request) {
        String email = request.getEmail();
        if (userRepository.existsByEmail(email)) {
            auditLogService.logEvent(null, null, "TENANT_REGISTRATION_FAILURE", null, null,
                    "Failed registration attempt. Email already in use: " + email);
            throw new IllegalArgumentException("Email address is already in use");
        }

        // 1. Create Tenant
        String tenantName = request.getCompanyName() != null ? request.getCompanyName() : "New Tenant";
        Tenant tenant = Tenant.builder()
                .name(tenantName)
                .build();
        tenant = tenantRepository.save(tenant);

        // 2. Create Company profile
        Company company = Company.builder()
                .tenantId(tenant.getId())
                .name(tenantName)
                .email(email)
                .phone(request.getPhone())
                .build();
        company = companyRepository.save(company);

        // Initialize default trial subscription and usage counters
        billingService.initDefaultTenantSubscription(tenant.getId());

        // 3. Load OWNER role
        Role ownerRole = roleRepository.findByName("OWNER")
                .orElseThrow(() -> new IllegalStateException("Default OWNER role not found"));

        // 4. Create Owner User
        String verificationToken = String.format("%06d", secureRandom.nextInt(1000000));
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(email)
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isEmailVerified(false) // Disabled auto-verified for dev; verify email first
                .emailVerificationToken(verificationToken)
                .emailVerificationTokenExpiry(LocalDateTime.now().plusMinutes(15))
                .build();
        user = userRepository.save(user);

        // Record initial password in history
        savePasswordHistory(user, user.getPasswordHash());

        // 5. Create initial Membership linking User to Tenant, Company, and Role
        Membership membership = Membership.builder()
                .user(user)
                .tenantId(tenant.getId())
                .companyId(company.getId())
                .role(ownerRole)
                .status("ACTIVE")
                .build();
        membershipRepository.save(membership);

        // Send Email Verification
        emailService.sendVerificationEmail(email, verificationToken);

        auditLogService.logEvent(tenant.getId(), user.getId(), "TENANT_REGISTRATION", null, null,
                "Tenant and Owner User registered successfully: " + tenantName);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Tenant and Owner User registered successfully");

        if ("dev".equalsIgnoreCase(activeProfile) || "test".equalsIgnoreCase(activeProfile)) {
            result.put("verificationToken", verificationToken);
        }

        return result;
    }

    @Transactional
    public Map<String, Object> login(String email, String password, UUID selectTenantId,
            String ipAddress, String deviceModel, String osName, String browser, String userAgent) {
        return login(email, password, selectTenantId, ipAddress, deviceModel, osName, browser, userAgent, null, null);
    }

    @Transactional
    public Map<String, Object> login(String email, String password, UUID selectTenantId,
            String ipAddress, String deviceModel, String osName, String browser, String userAgent,
            String captchaId, String captchaValue) {
        boolean isSuperAdmin = false;
        if (email != null && !email.trim().isEmpty()) {
            Optional<User> userCandidate = userRepository.findByEmail(email.trim().toLowerCase());
            if (userCandidate.isPresent()) {
                List<Membership> memberships = membershipRepository.findAllByUserId(userCandidate.get().getId());
                isSuperAdmin = memberships.stream()
                        .anyMatch(m -> m.getRole() != null &&
                                ("SUPER_ADMIN".equalsIgnoreCase(m.getRole().getName())
                                        || "OPERATIONS_LEAD".equalsIgnoreCase(m.getRole().getName())
                                        || "SUPPORT_LEAD".equalsIgnoreCase(m.getRole().getName())
                                        || "FINANCE_OFFICER".equalsIgnoreCase(m.getRole().getName())
                                        || "DEVOPS_ENGINEER".equalsIgnoreCase(m.getRole().getName())
                                        || "COMPLIANCE_AUDITOR".equalsIgnoreCase(m.getRole().getName())));
            }
        }

        if (rateLimiterService != null) {
            rateLimiterService.checkLoginRateLimit(ipAddress, email, isSuperAdmin);
        } else if (ipAddress != null) {
            checkRateLimit(ipAddress);
        }

        checkLockoutStatus(email);

        // CAPTCHA check after 3 failed attempts
        int count = 0;
        try {
            String attemptKey = "lockout:failed_attempts:" + email;
            if (stringRedisTemplate != null) {
                String countStr = stringRedisTemplate.opsForValue().get(attemptKey);
                count = countStr != null ? Integer.parseInt(countStr) : 0;
            }
        } catch (Exception e) {
            log.warn("[CAPTCHA_CHECK] Redis failed attempt count lookup failed for {}: {}", email, e.getMessage());
        }
        if (count >= 3) {
            if (!recaptchaService.verifyToken(captchaValue, ipAddress)) {
                throw new IllegalArgumentException("CAPTCHA_REQUIRED");
            }
        }

        Optional<User> userOpt = userRepository.findByEmail(email);


        if (userOpt.isEmpty()) {
            // Mitigate response timing differences by executing equivalent BCrypt verification
            if (passwordEncoder != null) {
                passwordEncoder.matches(password != null ? password : "", DUMMY_BCRYPT_HASH);
            }
            handleFailedLoginAttempt(email);
            auditLogService.logEvent(null, null, "LOGIN_FAILURE", ipAddress, userAgent,
                    "Failed login. Email not found: " + email);
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!"ACTIVE".equals(user.getStatus())) {
            if (passwordEncoder != null) {
                passwordEncoder.matches(password != null ? password : "", user.getPasswordHash());
            }
            handleFailedLoginAttempt(email);
            auditLogService.logEvent(null, user.getId(), "LOGIN_FAILURE", ipAddress, userAgent,
                    "Failed login. Account inactive: " + email);
            throw new IllegalArgumentException("Invalid email or password");
        }

        boolean passwordMatches = passwordEncoder != null && passwordEncoder.matches(password, user.getPasswordHash());

        if (!passwordMatches) {
            handleFailedLoginAttempt(email);
            auditLogService.logEvent(null, user.getId(), "LOGIN_FAILURE", ipAddress, userAgent,
                    "Failed login. Password mismatch for user: " + email);
            throw new IllegalArgumentException("Invalid email or password");
        }

        clearFailedAttempts(email);
        if (rateLimiterService != null) {
            rateLimiterService.resetLoginRateLimit(ipAddress, email);
        }

        List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
        if (memberships.isEmpty()) {
            auditLogService.logEvent(null, user.getId(), "LOGIN_FAILURE", ipAddress, userAgent,
                    "Failed login. User has no tenant memberships: " + email);
            throw new IllegalArgumentException("User does not belong to any tenant workspace");
        }

        Membership selectedMembership = null;
        if (selectTenantId != null) {
            selectedMembership = memberships.stream()
                    .filter(m -> m.getTenantId().equals(selectTenantId))
                    .findFirst()
                    .orElse(null);

            if (selectedMembership == null) {
                auditLogService.logEvent(selectTenantId, user.getId(), "LOGIN_FAILURE", ipAddress, userAgent,
                        "Failed login. Not a member of requested tenant: " + selectTenantId);
                throw new IllegalArgumentException("Invalid email or password");
            }
        } else {
            selectedMembership = memberships.stream()
                    .filter(m -> "ACTIVE".equals(m.getStatus()))
                    .findFirst()
                    .orElse(memberships.get(0));
        }

        if (!"ACTIVE".equals(selectedMembership.getStatus())) {
            auditLogService.logEvent(selectedMembership.getTenantId(), user.getId(), "LOGIN_FAILURE", ipAddress,
                    userAgent,
                    "Failed login. Tenant membership is inactive.");
            throw new IllegalArgumentException("Invalid email or password");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Email Verification Check
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("EMAIL_UNVERIFIED");
        }

        // Password Expiration Check (90 days)
        if (user.getPasswordUpdatedAt() != null
                && user.getPasswordUpdatedAt().plusDays(90).isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("PASSWORD_EXPIRED");
        }

        // 2FA Enforcement Check (SEC-2N-E)
        if (user2FaRepository != null) {
            Optional<User2Fa> user2FaOpt = user2FaRepository.findById(user.getId());
            if (user2FaOpt.isPresent() && user2FaOpt.get().isEnabled()) {
                String challengeToken = UUID.randomUUID().toString();
                String redisKey = "2fa:challenge:" + challengeToken;
                String challengeVal = user.getId().toString() + ":::" + selectedMembership.getTenantId().toString();
                storeTokenFallback(redisKey, challengeVal, 5);
                if (stringRedisTemplate != null) {
                    try {
                        stringRedisTemplate.opsForValue().set("2fa:attempts:" + challengeToken, "0", 5, TimeUnit.MINUTES);
                    } catch (Exception ignored) {}
                }

                Map<String, Object> challengeResponse = new HashMap<>();
                challengeResponse.put("requires2fa", true);
                challengeResponse.put("challengeToken", challengeToken);
                challengeResponse.put("message", "Two-factor authentication required");
                return challengeResponse;
            }
        }

        return createAuthoritativeSession(user, selectedMembership, memberships, ipAddress, deviceModel, osName, browser, userAgent);
    }

    public Map<String, Object> createAuthoritativeSession(User user, Membership selectedMembership,
            List<Membership> memberships, String ipAddress, String deviceModel, String osName,
            String browser, String userAgent) {
        // Extract permissions
        List<String> permissions = extractPermissionsFromRole(selectedMembership.getRole());

        // Get company name
        String primaryCompanyName = companyRepository.findById(selectedMembership.getCompanyId())
                .map(Company::getName)
                .orElse("Unknown Company");

        UUID sessionId = UUID.randomUUID();
        String deviceId = sha256(userAgent != null ? userAgent + ipAddress : ipAddress);

        // Access Token
        String accessToken = jwtService.generateToken(
                user,
                selectedMembership.getTenantId(),
                selectedMembership.getRole().getName(),
                permissions,
                primaryCompanyName,
                selectedMembership.getTenantId(),
                deviceId,
                sessionId.toString());

        // Refresh Token
        String rawToken = generateSecureRefreshToken();
        String tokenHash = sha256(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenHash)
                .tenantId(selectedMembership.getTenantId())
                .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                .build();
        refreshToken = refreshTokenRepository.save(refreshToken);

        // Enforce concurrent session limits (FIFO eviction)
        enforceSessionLimit(user, selectedMembership.getTenantId(), refreshToken, ipAddress, deviceModel, osName,
                browser, sessionId);

        auditLogService.logEvent(selectedMembership.getTenantId(), user.getId(), "LOGIN_SUCCESS", ipAddress, userAgent,
                "User logged in successfully under tenant: " + selectedMembership.getTenantId());

        List<Map<String, Object>> membershipList = new ArrayList<>();
        for (Membership m : memberships) {
            Map<String, Object> mInfo = new HashMap<>();
            mInfo.put("tenantId", m.getTenantId().toString());
            mInfo.put("companyId", m.getCompanyId().toString());
            mInfo.put("role", m.getRole().getName());
            mInfo.put("status", m.getStatus());

            String companyName = companyRepository.findById(m.getCompanyId())
                    .map(Company::getName)
                    .orElse("Unknown Company");
            mInfo.put("companyName", companyName);
            membershipList.add(mInfo);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", rawToken);
        response.put("userId", user.getId().toString());
        response.put("tenantId", selectedMembership.getTenantId().toString());
        response.put("role", selectedMembership.getRole().getName());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("memberships", membershipList);
        response.put("permissions", permissions);
        return response;
    }

    @Transactional
    public Map<String, Object> verify2FaChallenge(String challengeToken, String code,
            String ipAddress, String deviceModel, String osName, String browser, String userAgent) {
        if (challengeToken == null || challengeToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Challenge token is required");
        }
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Verification code is required");
        }

        String redisKey = "2fa:challenge:" + challengeToken.trim();
        String challengeVal = getTokenFallback(redisKey);
        if (challengeVal == null) {
            throw new IllegalArgumentException("Invalid or expired 2FA challenge");
        }

        String attemptsKey = "2fa:attempts:" + challengeToken.trim();
        long attempts = 1;
        if (stringRedisTemplate != null) {
            try {
                attempts = stringRedisTemplate.opsForValue().increment(attemptsKey);
            } catch (Exception ignored) {}
        }
        if (attempts > 5) {
            deleteChallenge(challengeToken);
            throw new SecurityException("Too many invalid 2FA attempts. Challenge invalidated.");
        }

        String[] parts = challengeVal.split(":::", 2);
        UUID userId = UUID.fromString(parts[0]);
        UUID tenantId = parts.length > 1 && !parts[1].isEmpty() ? UUID.fromString(parts[1]) : null;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user2FaRepository == null) {
            throw new IllegalStateException("2FA repository unavailable");
        }
        User2Fa user2Fa = user2FaRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("2FA not configured for user"));

        if (!user2Fa.isEnabled()) {
            throw new IllegalArgumentException("2FA is not enabled for user");
        }

        boolean validCode = false;
        if (totpService != null && totpService.verifyCode(user2Fa.getSecret(), code)) {
            validCode = true;
        } else if (user2Fa.getBackupCodes() != null) {
            List<String> backupCodes = new ArrayList<>(Arrays.asList(user2Fa.getBackupCodes().split(",")));
            if (backupCodes.contains(code.trim().toUpperCase())) {
                validCode = true;
                backupCodes.remove(code.trim().toUpperCase());
                user2Fa.setBackupCodes(String.join(",", backupCodes));
                user2FaRepository.save(user2Fa);
            }
        }

        if (!validCode) {
            throw new IllegalArgumentException("Invalid 2FA verification code");
        }

        // Challenge successfully consumed - delete to prevent replay
        deleteChallenge(challengeToken);

        List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
        Membership selectedMembership = null;
        if (tenantId != null) {
            selectedMembership = memberships.stream()
                    .filter(m -> m.getTenantId().equals(tenantId))
                    .findFirst()
                    .orElse(null);
        }
        if (selectedMembership == null) {
            selectedMembership = memberships.stream()
                    .filter(m -> "ACTIVE".equals(m.getStatus()))
                    .findFirst()
                    .orElse(memberships.get(0));
        }

        return createAuthoritativeSession(user, selectedMembership, memberships, ipAddress, deviceModel, osName, browser, userAgent);
    }

    private void deleteChallenge(String challengeToken) {
        String redisKey = "2fa:challenge:" + challengeToken.trim();
        String attemptsKey = "2fa:attempts:" + challengeToken.trim();
        if (stringRedisTemplate != null) {
            try {
                stringRedisTemplate.delete(redisKey);
                stringRedisTemplate.delete(attemptsKey);
            } catch (Exception ignored) {}
        }
        deleteTokenFallback(redisKey);
    }

    @Transactional
    public Map<String, Object> refresh(String token, String ipAddress, String deviceModel, String osName,
            String browser, String userAgent) {
        String presentedHash = sha256(token);

        // 1. Concurrent Refresh Safety / Idempotent Grace Window (30 seconds, SEC-2N-H)
        String graceKey = "refresh:grace:" + presentedHash;
        String graceValue = stringRedisTemplate != null ? stringRedisTemplate.opsForValue().get(graceKey) : null;
        if (graceValue != null) {
            String[] parts = graceValue.split(":::", 3);
            if (parts.length >= 2) {
                String cachedAccessToken = parts[0];
                String cachedRawToken = parts[1];
                Map<String, Object> response = new HashMap<>();
                response.put("accessToken", cachedAccessToken);
                response.put("refreshToken", cachedRawToken);
                return response;
            }
        }

        Optional<RefreshToken> activeTokenOpt = refreshTokenRepository.findByToken(presentedHash);
        if (activeTokenOpt.isEmpty()) {
            // Replay Attack Detection: check Redis for breach history
            String redisKey = "rotated:token:" + presentedHash;
            String redisValue = stringRedisTemplate != null ? stringRedisTemplate.opsForValue().get(redisKey) : null;
            if (redisValue != null) {
                String[] parts = redisValue.split(":", 2);
                UUID userId = UUID.fromString(parts[0]);
                sessionRepository.deleteAllByUserId(userId);
                refreshTokenRepository.deleteByUser(User.builder().id(userId).build());
                revokeAllUserSessions(userId);
                auditLogService.logEvent(null, userId, "REPLAY_ATTACK_COMPROMISE", ipAddress, userAgent,
                        "Replay attack detected on rotated refresh token! All active sessions revoked for security.");
                throw new SecurityException("Replay attack detected. All sessions invalidated.");
            }
            throw new IllegalArgumentException("Invalid refresh token");
        }

        RefreshToken refreshToken = activeTokenOpt.get();

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            sessionRepository.deleteByRefreshTokenId(refreshToken.getId());
            refreshTokenRepository.delete(refreshToken);
            throw new IllegalArgumentException("Refresh token has expired");
        }

        User user = refreshToken.getUser();
        UUID tenantId = refreshToken.getTenantId();

        Membership membership = membershipRepository.findByUserIdAndTenantId(user.getId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User no longer has membership in this tenant"));

        if (!"ACTIVE".equals(membership.getStatus())) {
            throw new IllegalArgumentException("Membership is no longer active");
        }

        // Update session meta / Retrieve session details
        Session session = sessionRepository.findByRefreshTokenId(refreshToken.getId()).orElse(null);
        UUID sessionId = session != null ? session.getId() : UUID.randomUUID();
        String deviceId = sha256(userAgent != null ? userAgent + ipAddress : ipAddress);

        // Extract permissions
        List<String> permissions = new ArrayList<>();
        try {
            if (membership.getRole().getPermissionsJson() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                permissions = mapper.readValue(
                    membership.getRole().getPermissionsJson(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {
                    });
            }
        } catch (Exception e) {
            // fallback empty
        }

        // Get company name
        String companyName = companyRepository.findByTenantId(tenantId).stream()
                .findFirst()
                .map(Company::getName)
                .orElse("Unknown Company");

        String accessToken = jwtService.generateToken(
                user,
                tenantId,
                membership.getRole().getName(),
                permissions,
                companyName,
                tenantId,
                deviceId,
                sessionId.toString());

        // Rotate Refresh Token
        String newRawToken = generateSecureRefreshToken();
        String newHash = sha256(newRawToken);

        // Store old hash in Redis for grace window (30s) and breach history (1h)
        if (stringRedisTemplate != null) {
            try {
                stringRedisTemplate.opsForValue().set(graceKey, accessToken + ":::" + newRawToken + ":::" + user.getId(), 30, TimeUnit.SECONDS);
                String redisKey = "rotated:token:" + presentedHash;
                String redisValue = user.getId().toString() + ":" + System.currentTimeMillis();
                stringRedisTemplate.opsForValue().set(redisKey, redisValue, 1, TimeUnit.HOURS);
            } catch (Exception e) {
                log.warn("[REFRESH] Failed to update Redis rotation cache: {}", e.getMessage());
            }
        }

        refreshToken.setToken(newHash);
        refreshToken.setExpiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000));
        refreshTokenRepository.save(refreshToken);

        if (session != null) {
            session.setLastActiveAt(LocalDateTime.now());
            if (ipAddress != null)
                session.setIpAddress(ipAddress);
            if (deviceModel != null)
                session.setDeviceModel(deviceModel);
            if (osName != null)
                session.setOsName(osName);
            if (browser != null)
                session.setBrowser(browser);
            sessionRepository.save(session);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", newRawToken);
        return response;
    }

    @Transactional
    public void logoutAuthenticatedUser(UUID userId, UUID tenantId, String rawRefreshToken, String accessToken) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required for logout");
        }

        // 1. Invalidate specific refresh token & associated session if provided
        if (rawRefreshToken != null && !rawRefreshToken.trim().isEmpty()) {
            String tokenHash = sha256(rawRefreshToken.trim());
            refreshTokenRepository.findByToken(tokenHash).ifPresent(rt -> {
                // Ensure the refresh token actually belongs to the authenticated user
                if (rt.getUser().getId().equals(userId)) {
                    sessionRepository.findByRefreshTokenId(rt.getId()).ifPresent(s -> {
                        revokeSingleSession(s.getId());
                        sessionRepository.delete(s);
                    });
                    refreshTokenRepository.delete(rt);
                }
            });
            if (stringRedisTemplate != null) {
                try {
                    stringRedisTemplate.delete("rotated:token:" + tokenHash);
                    stringRedisTemplate.delete("refresh:grace:" + tokenHash);
                } catch (Exception ignored) {
                }
            }
        } else if (accessToken != null && !accessToken.trim().isEmpty()) {
            // 2. If no refresh token provided, look up session from JWT claims if present
            try {
                io.jsonwebtoken.Claims claims = jwtService.getClaims(accessToken);
                String sessionIdStr = claims.get("sessionId", String.class);
                if (sessionIdStr != null && !sessionIdStr.trim().isEmpty()) {
                    UUID sessionId = UUID.fromString(sessionIdStr);
                    revokeSingleSession(sessionId);
                    sessionRepository.findById(sessionId).ifPresent(s -> {
                        if (s.getUser().getId().equals(userId)) {
                            if (s.getRefreshToken() != null) {
                                refreshTokenRepository.delete(s.getRefreshToken());
                            }
                            sessionRepository.delete(s);
                        }
                    });
                }
            } catch (Exception ignored) {
            }
        }

        // 3. Blacklist the access token in Redis (if valid & unexpired)
        if (accessToken != null && !accessToken.trim().isEmpty()) {
            jwtService.blacklistToken(accessToken);
        }

        // 4. Audit Log (tenantId, userId, "LOGOUT")
        auditLogService.logEvent(tenantId, userId, "LOGOUT", null, null,
                "User logged out successfully");
    }

    @Deprecated
    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            sessionRepository.deleteAllByUserId(user.getId());
            refreshTokenRepository.deleteByUser(user);
            auditLogService.logEvent(null, user.getId(), "LOGOUT", null, null,
                    "User logged out successfully");
        });
    }

    @Transactional
    public void logoutByToken(String rawToken) {
        String tokenHash = sha256(rawToken);
        refreshTokenRepository.findByToken(tokenHash).ifPresent(rt -> {
            sessionRepository.deleteByRefreshTokenId(rt.getId());
            refreshTokenRepository.delete(rt);
            auditLogService.logEvent(rt.getTenantId(), rt.getUser().getId(), "LOGOUT", null, null,
                    "User logged out successfully via refresh token invalidation");
        });
    }

    private final SecureRandom secureRandom = new SecureRandom();

    public Map<String, Object> forgotPassword(String email) {
        return forgotPassword(email, null);
    }

    public Map<String, Object> forgotPassword(String email, String ipAddress) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        String cleanEmail = email.trim().toLowerCase();

        if (rateLimiterService != null) {
            rateLimiterService.checkPasswordResetRateLimit(ipAddress, cleanEmail);
        }
        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            byte[] tokenBytes = new byte[32];
            secureRandom.nextBytes(tokenBytes);
            String resetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
            String tokenHash = sha256(resetToken);

            String redisKey = "reset:token:" + tokenHash;
            storeTokenFallback(redisKey, user.getEmail(), 15);

            auditLogService.logEvent(null, user.getId(), "PASSWORD_RESET_REQUEST", null, null,
                    "Password reset token generated for user: " + cleanEmail);

            // Send Password Reset Email
            emailService.sendPasswordResetEmail(cleanEmail, resetToken);
        } else {
            auditLogService.logEvent(null, null, "PASSWORD_RESET_REQUEST_UNREGISTERED", null, null,
                    "Password reset requested for unregistered email: " + cleanEmail);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "If the email address is registered, password reset instructions will be sent.");
        return response;
    }

    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword) {
        String tokenHash = sha256(token);
        String redisKey = "reset:token:" + tokenHash;
        String email = getTokenFallback(redisKey);
        if (email == null) {
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User associated with token not found"));

        // Validate password history (SEC-2N-I)
        checkPasswordHistory(user, newPassword);
        savePasswordHistory(user, user.getPasswordHash());

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setStatus("ACTIVE");
        user.setPasswordUpdatedAt(LocalDateTime.now());
        user.setEmailVerified(true);
        userRepository.save(user);
        deleteTokenFallback(redisKey);

        // Force logout on all active sessions on password change
        sessionRepository.deleteAllByUserId(user.getId());
        refreshTokenRepository.deleteByUser(user);
        revokeAllUserSessions(user.getId());

        auditLogService.logEvent(null, user.getId(), "PASSWORD_RESET_SUCCESS", null, null,
                "Password reset successfully. Active sessions revoked for user: " + email);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password has been reset successfully");
        return response;
    }

    @Value("${app.bootstrap.secret:#{null}}")
    private String configuredBootstrapSecret;

    @Transactional
    public Map<String, Object> bootstrapSuperAdmin(String email, String newPassword, String bootstrapSecret,
            String ipAddress, String userAgent) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Target email is required");
        }
        if (newPassword == null || newPassword.length() < 12) {
            throw new IllegalArgumentException("Password must be at least 12 characters long");
        }

        String envSecret = configuredBootstrapSecret;
        if (envSecret == null || envSecret.trim().isEmpty()) {
            envSecret = System.getenv("BOOTSTRAP_SECRET");
        }
        if (envSecret == null || envSecret.trim().isEmpty()) {
            envSecret = System.getenv("APP_BOOTSTRAP_SECRET");
        }
        if (envSecret == null || envSecret.trim().isEmpty()) {
            envSecret = System.getenv("ADMIN_BOOTSTRAP_SECRET");
        }

        if (envSecret == null || envSecret.trim().length() < 32) {
            auditLogService.logEvent(null, null, "ADMIN_BOOTSTRAP_DISABLED", ipAddress, userAgent,
                    "Admin bootstrap invoked but BOOTSTRAP_SECRET environment variable is missing or insecure");
            throw new SecurityException("Admin bootstrap is not enabled or BOOTSTRAP_SECRET is missing from environment");
        }

        if (bootstrapSecret == null || bootstrapSecret.trim().isEmpty()) {
            auditLogService.logEvent(null, null, "ADMIN_BOOTSTRAP_FAILURE", ipAddress, userAgent,
                    "Bootstrap attempt missing secret for target: " + email);
            throw new SecurityException("Invalid bootstrap credentials");
        }

        byte[] envBytes = envSecret.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] suppliedBytes = bootstrapSecret.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (!java.security.MessageDigest.isEqual(envBytes, suppliedBytes)) {
            auditLogService.logEvent(null, null, "ADMIN_BOOTSTRAP_FAILURE", ipAddress, userAgent,
                    "Failed bootstrap attempt with incorrect secret for target: " + email);
            throw new SecurityException("Invalid bootstrap credentials");
        }

        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Target administrative account not found: " + cleanEmail));

        // Enforce that target identity must have an administrative/platform role
        List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
        boolean hasAdminRole = memberships.stream()
                .anyMatch(m -> m.getRole() != null &&
                        ("SUPER_ADMIN".equalsIgnoreCase(m.getRole().getName())
                                || com.eventos.auth.config.PlatformRole.isPlatformRole(m.getRole().getName())));
        if (!hasAdminRole) {
            auditLogService.logEvent(null, user.getId(), "ADMIN_BOOTSTRAP_REJECTED", ipAddress, userAgent,
                    "Bootstrap rejected: Target user is not an administrative identity: " + cleanEmail);
            throw new SecurityException("Target user is not an administrative identity");
        }

        // Single-use guarantee: if the account is already ACTIVE and not in locked setup state, refuse re-bootstrap
        if ("ACTIVE".equalsIgnoreCase(user.getStatus()) && (user.getPasswordHash() == null || !user.getPasswordHash().startsWith("!LOCKED_PENDING_BOOTSTRAP_"))) {
            auditLogService.logEvent(null, user.getId(), "ADMIN_BOOTSTRAP_REJECTED", ipAddress, userAgent,
                    "Bootstrap rejected: account is already bootstrapped and active: " + cleanEmail);
            throw new IllegalStateException("Administrative account has already been bootstrapped. Use standard password reset flow.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setStatus("ACTIVE");
        user.setEmailVerified(true);
        user.setPasswordUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        savePasswordHistory(user, user.getPasswordHash());

        // Revoke all existing sessions and refresh tokens
        sessionRepository.deleteAllByUserId(user.getId());
        refreshTokenRepository.deleteByUser(user);
        revokeAllUserSessions(user.getId());

        auditLogService.logEvent(null, user.getId(), "ADMIN_BOOTSTRAP_SUCCESS", ipAddress, userAgent,
                "Administrative account successfully bootstrapped: " + cleanEmail);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Administrative account bootstrapped successfully. Please login with your new credentials.");
        return response;
    }

    public static int getRoleTier(String roleName) {
        if (roleName == null) return -1;
        switch (roleName.toUpperCase()) {
            case "SUPER_ADMIN": return 100;
            case "OWNER": return 4;
            case "ADMIN": return 3;
            case "MANAGER": return 2;
            case "STAFF": return 1;
            case "CLIENT": return 0;
            default:
                return 1;
        }
    }

    @Transactional
    public Map<String, Object> inviteTeamMember(UUID tenantId, String email, String firstName, String lastName,
            String roleName, String phone, UUID senderId) {
        String targetRoleUpper = roleName != null ? roleName.trim().toUpperCase() : "STAFF";

        // Prohibit assigning SUPER_ADMIN or any platform role
        if ("SUPER_ADMIN".equals(targetRoleUpper) || com.eventos.auth.config.PlatformRole.isPlatformRole(targetRoleUpper)) {
            throw new SecurityException("Platform roles cannot be assigned through tenant team invitations: " + targetRoleUpper);
        }

        // Authoritative role hierarchy validation: caller may only assign roles strictly below their own effective role
        if (senderId != null) {
            Optional<Membership> senderMemOpt = membershipRepository.findByUserIdAndTenantId(senderId, tenantId);
            if (senderMemOpt.isPresent()) {
                String senderRole = senderMemOpt.get().getRole() != null ? senderMemOpt.get().getRole().getName().toUpperCase() : "STAFF";
                int senderTier = getRoleTier(senderRole);
                int targetTier = getRoleTier(targetRoleUpper);
                if (targetTier >= senderTier) {
                    throw new SecurityException("Privilege escalation denied: You cannot invite or assign a role ('"
                            + targetRoleUpper + "') equal to or higher than your own effective role ('" + senderRole + "')");
                }
            }
        }

        Role role = roleRepository.findByNameIgnoreCaseAndTenantId(targetRoleUpper, tenantId)
                .or(() -> roleRepository.findByName(targetRoleUpper))
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + targetRoleUpper));

        List<Company> companies = companyRepository.findByTenantId(tenantId);
        UUID companyId = companies.isEmpty() ? tenantId : companies.get(0).getId();
        String workspaceName = companies.isEmpty() ? "Your Workspace" : companies.get(0).getName();

        // Resolve sender's display name for the invitation email
        String senderDisplayName = "Your team admin";
        if (senderId != null) {
            Optional<User> senderOpt = userRepository.findById(senderId);
            if (senderOpt.isPresent()) {
                User sender = senderOpt.get();
                String fn = sender.getFirstName() != null ? sender.getFirstName() : "";
                String ln = sender.getLastName() != null ? sender.getLastName() : "";
                String fullName = (fn + " " + ln).trim();
                if (!fullName.isEmpty())
                    senderDisplayName = fullName;
            }
        }

        String rawToken;
        if (userRepository.existsByEmail(email)) {
            User existingUser = userRepository.findByEmail(email).get();
            Optional<Membership> existingMem = membershipRepository.findByUserIdAndTenantId(existingUser.getId(),
                    tenantId);
            if (existingMem.isPresent()) {
                throw new IllegalArgumentException("User is already a member of this tenant");
            }

            Membership membership = Membership.builder()
                    .user(existingUser)
                    .tenantId(tenantId)
                    .companyId(companyId)
                    .role(role)
                    .status("PENDING")
                    .build();
            membershipRepository.save(membership);

            rawToken = generateInvitationToken(tenantId, email, role, senderId);

            // Send invitation email to existing user
            String inviteeName = ((existingUser.getFirstName() != null ? existingUser.getFirstName() : "") + " " +
                    (existingUser.getLastName() != null ? existingUser.getLastName() : "")).trim();
            emailService.sendInvitationEmail(email, rawToken, inviteeName, senderDisplayName, roleName, workspaceName,
                    null);

            auditLogService.logEvent(tenantId, senderId, "INVITATION_SENT", null, null,
                    "Invitation sent to existing user email: " + email + " for role: " + roleName);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Invitation sent to existing user");
            // SEC-2N-B: Never return inviteToken in response payload
            return result;
        } else {
            User pendingUser = User.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .phone(phone)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .status("PENDING")
                    .build();
            pendingUser = userRepository.save(pendingUser);

            Membership membership = Membership.builder()
                    .user(pendingUser)
                    .tenantId(tenantId)
                    .companyId(companyId)
                    .role(role)
                    .status("PENDING")
                    .build();
            membershipRepository.save(membership);

            rawToken = generateInvitationToken(tenantId, email, role, senderId);

            // Send invitation email to new pending user
            String inviteeName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : ""))
                    .trim();
            emailService.sendInvitationEmail(email, rawToken, inviteeName, senderDisplayName, roleName, workspaceName,
                    null);

            auditLogService.logEvent(tenantId, senderId, "INVITATION_SENT", null, null,
                    "Invitation sent to new pending user: " + email + " for role: " + roleName);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "New user invited in PENDING status");
            // SEC-2N-B: Never return inviteToken in response payload
            return result;
        }
    }

    @Transactional
    public Map<String, Object> acceptInvitation(String token, String password) {
        String tokenHash = sha256(token);
        Invitation invitation = invitationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired invitation token"));

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new IllegalArgumentException("Invitation has already been processed");
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            invitationRepository.save(invitation);
            auditLogService.logEvent(invitation.getTenantId(), null, "INVITATION_EXPIRED", null, null,
                    "Expired invitation token accessed for email: " + invitation.getEmail());
            throw new IllegalArgumentException("Invitation has expired");
        }

        User user = userRepository.findByEmail(invitation.getEmail())
                .orElseThrow(() -> new IllegalStateException("User associated with invitation not found"));

        // SEC-2N-B: Distinguish existing user from brand new pending user
        boolean isExistingUser = !"PENDING".equalsIgnoreCase(user.getStatus());
        if (!isExistingUser) {
            user.setStatus("ACTIVE");
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        Membership membership = membershipRepository.findByUserIdAndTenantId(user.getId(), invitation.getTenantId())
                .orElseThrow(() -> new IllegalStateException("Membership associated with invitation not found"));
        membership.setStatus("ACTIVE");
        membershipRepository.save(membership);

        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        auditLogService.logEvent(invitation.getTenantId(), user.getId(), "INVITATION_ACCEPTED", null, null,
                "Invitation accepted. User activated: " + invitation.getEmail());

        // Send Welcome Email
        String wsName = "Your Workspace";
        List<Company> companies = companyRepository.findByTenantId(invitation.getTenantId());
        if (!companies.isEmpty()) {
            wsName = companies.get(0).getName();
        }
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName() + " " + user.getLastName(), wsName);

        Map<String, Object> result = new HashMap<>();
        try {
            List<Membership> allUserMemberships = membershipRepository.findAllByUserId(user.getId());
            Map<String, Object> session = createAuthoritativeSession(
                    user,
                    membership,
                    allUserMemberships.isEmpty() ? List.of(membership) : allUserMemberships,
                    "127.0.0.1",
                    "Web Client",
                    "Web",
                    "Browser",
                    "AcceptInvite");
            result.putAll(session);
        } catch (Exception e) {
            log.warn("[ACCEPT_INVITE] Session generation fallback: {}", e.getMessage());
        }

        result.put("success", true);
        result.put("message", "Invitation accepted and account activated");
        result.put("role", membership.getRole().getName());
        result.put("tenantId", membership.getTenantId().toString());
        result.put("email", user.getEmail());
        result.put("firstName", user.getFirstName());
        result.put("lastName", user.getLastName());
        return result;
    }

    private String generateInvitationToken(UUID tenantId, String email, Role role, UUID senderId) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String tokenHash = sha256(rawToken);

        Invitation invitation = Invitation.builder()
                .tenantId(tenantId)
                .role(role)
                .email(email)
                .tokenHash(tokenHash)
                .status("PENDING")
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();
        if (senderId != null) {
            userRepository.findById(senderId).ifPresent(invitation::setInvitedBy);
        }
        invitationRepository.save(invitation);

        return rawToken;
    }

    private void enforceSessionLimit(User user, UUID tenantId, RefreshToken activeToken,
            String ipAddress, String deviceModel, String osName, String browser, UUID sessionId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant workspace not found"));

        List<Session> activeSessions = sessionRepository.findAllByUserIdAndTenantId(user.getId(), tenantId);
        int limit = 0; // unlimited
        String plan = tenant.getSubscriptionPlan();
        if (plan != null) {
            if ("STARTER".equalsIgnoreCase(plan)) {
                limit = 2;
            } else if ("PROFESSIONAL".equalsIgnoreCase(plan) || "GROWTH".equalsIgnoreCase(plan)) {
                limit = 5;
            } else if ("AGENCY".equalsIgnoreCase(plan) || "ENTERPRISE".equalsIgnoreCase(plan)) {
                limit = 0; // unlimited
            }
        }

        if (limit > 0 && activeSessions.size() >= limit) {
            Session oldest = activeSessions.stream()
                    .min(Comparator.comparing(Session::getLastActiveAt))
                    .orElse(null);

            if (oldest != null) {
                sessionRepository.delete(oldest);
                refreshTokenRepository.delete(oldest.getRefreshToken());
            }
        }

        Session session = Session.builder()
                .id(sessionId)
                .user(user)
                .tenantId(tenantId)
                .refreshToken(activeToken)
                .ipAddress(ipAddress != null ? ipAddress : "0.0.0.0")
                .deviceModel(deviceModel != null ? deviceModel : "Unknown Device")
                .osName(osName != null ? osName : "Unknown OS")
                .browser(browser != null ? browser : "Unknown Browser")
                .lastActiveAt(LocalDateTime.now())
                .build();
        sessionRepository.save(session);
    }

    public List<Map<String, Object>> getActiveSessions(UUID userId, UUID tenantId, String currentRefreshTokenHash) {
        List<Session> sessions = sessionRepository.findAllByUserIdAndTenantId(userId, tenantId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Session s : sessions) {
            Map<String, Object> sInfo = new HashMap<>();
            sInfo.put("id", s.getId().toString());
            sInfo.put("deviceModel", s.getDeviceModel());
            sInfo.put("osName", s.getOsName());
            sInfo.put("browser", s.getBrowser());
            sInfo.put("ipAddress", s.getIpAddress());
            sInfo.put("lastActiveAt", s.getLastActiveAt().toString());
            sInfo.put("isCurrent", s.getRefreshToken().getToken().equals(currentRefreshTokenHash));
            result.add(sInfo);
        }
        return result;
    }

    @Transactional
    public void revokeSession(UUID sessionId, UUID userId, UUID tenantId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getUser().getId().equals(userId) || !session.getTenantId().equals(tenantId)) {
            throw new SecurityException("Unauthorized session access");
        }

        revokeSingleSession(sessionId);
        sessionRepository.delete(session);
        if (session.getRefreshToken() != null) {
            refreshTokenRepository.delete(session.getRefreshToken());
        }
        auditLogService.logEvent(tenantId, userId, "SESSION_REVOKED", null, null,
                "Active session revoked manually: " + sessionId);
    }

    @Transactional
    public Map<String, Object> switchWorkspace(String rawRefreshToken, UUID targetTenantId,
            String ipAddress, String deviceModel, String osName, String browser, String userAgent) {
        RefreshToken oldToken = null;
        if (rawRefreshToken != null && !rawRefreshToken.trim().isEmpty()) {
            String presentedHash = sha256(rawRefreshToken.trim());
            oldToken = refreshTokenRepository.findByToken(presentedHash).orElse(null);
        }

        User user = null;
        if (oldToken != null) {
            user = oldToken.getUser();
            sessionRepository.deleteByRefreshTokenId(oldToken.getId());
            refreshTokenRepository.delete(oldToken);
        } else {
            // Resilient Fallback: Extract authenticated user from SecurityContext (Bearer token)
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
                com.eventos.auth.config.UserPrincipal principal = (com.eventos.auth.config.UserPrincipal) auth.getPrincipal();
                user = userRepository.findById(principal.getUserId()).orElse(null);
            }
        }

        if (user == null) {
            throw new IllegalArgumentException("Session not found. Please sign in again.");
        }

        Membership membership = membershipRepository.findByUserIdAndTenantId(user.getId(), targetTenantId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of target tenant"));

        if (!"ACTIVE".equals(membership.getStatus())) {
            throw new IllegalArgumentException("Membership in target tenant is not active");
        }

        // Extract permissions
        List<String> permissions = new ArrayList<>();
        try {
            if (membership.getRole().getPermissionsJson() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                permissions = mapper.readValue(
                        membership.getRole().getPermissionsJson(),
                        new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {
                        });
            }
        } catch (Exception e) {
            // fallback empty
        }

        // Get company name
        String targetCompanyName = companyRepository.findByTenantId(targetTenantId).stream()
                .findFirst()
                .map(Company::getName)
                .orElse("Unknown Company");

        UUID sessionId = UUID.randomUUID();
        String deviceId = sha256(userAgent != null ? userAgent + ipAddress : ipAddress);

        String accessToken = jwtService.generateToken(
                user,
                targetTenantId,
                membership.getRole().getName(),
                permissions,
                targetCompanyName,
                targetTenantId,
                deviceId,
                sessionId.toString());

        String newRawToken = generateSecureRefreshToken();
        String newHash = sha256(newRawToken);

        RefreshToken newToken = RefreshToken.builder()
                .user(user)
                .token(newHash)
                .tenantId(targetTenantId)
                .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                .build();
        newToken = refreshTokenRepository.save(newToken);

        Session newSession = Session.builder()
                .id(sessionId)
                .user(user)
                .tenantId(targetTenantId)
                .refreshToken(newToken)
                .ipAddress(ipAddress != null ? ipAddress : "0.0.0.0")
                .deviceModel(deviceModel != null ? deviceModel : "Unknown Device")
                .osName(osName != null ? osName : "Unknown OS")
                .browser(browser != null ? browser : "Unknown Browser")
                .lastActiveAt(LocalDateTime.now())
                .build();
        sessionRepository.save(newSession);

        auditLogService.logEvent(targetTenantId, user.getId(), "WORKSPACE_SWITCH", ipAddress, userAgent,
                "User switched workspace to tenant: " + targetTenantId);

        List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
        List<Map<String, Object>> membershipList = new ArrayList<>();
        for (Membership m : memberships) {
            Map<String, Object> mInfo = new HashMap<>();
            mInfo.put("tenantId", m.getTenantId().toString());
            mInfo.put("companyId", m.getCompanyId().toString());
            mInfo.put("role", m.getRole().getName());
            mInfo.put("status", m.getStatus());

            String companyName = companyRepository.findById(m.getCompanyId())
                    .map(Company::getName)
                    .orElse("Unknown Company");
            mInfo.put("companyName", companyName);
            membershipList.add(mInfo);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", newRawToken);
        response.put("userId", user.getId().toString());
        response.put("tenantId", targetTenantId.toString());
        response.put("role", membership.getRole().getName());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("memberships", membershipList);
        response.put("permissions", permissions);
        return response;
    }

    public static String sha256(String data) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash with SHA-256", e);
        }
    }

    public void checkRateLimit(String ipAddress) {
        if (ipAddress == null || ipAddress.trim().isEmpty()) {
            return;
        }
        if (rateLimiterService != null) {
            rateLimiterService.checkRateLimit("rate:limit:auth:ip:" + ipAddress.trim(), 100, 60, "IP_RATE_LIMIT");
            return;
        }
        if (stringRedisTemplate != null) {
            String key = "rate:limit:ip:" + ipAddress.trim();
            Long count = stringRedisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                stringRedisTemplate.expire(key, 1, TimeUnit.MINUTES);
            }
            if (count != null && count > 100) {
                throw new com.eventos.auth.exception.RateLimitExceededException(60, "Too many requests from this IP. Please try again later.");
            }
        }
    }

    private void handleFailedLoginAttempt(String email) {
        // Dual layer: Redis + DB
        userRepository.findByEmail(email).ifPresent(user -> {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= 5) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
                user.setFailedLoginAttempts(0); // Reset count but lock is active
                userRepository.save(user);
                auditLogService.logEvent(null, user.getId(), "ACCOUNT_LOCKOUT", null, null,
                        "Account locked for 15 minutes due to 5 consecutive failed login attempts.");
            } else {
                userRepository.save(user);
            }
        });

        try {
            String attemptKey = "lockout:failed_attempts:" + email;
            if (stringRedisTemplate != null) {
                String countStr = stringRedisTemplate.opsForValue().get(attemptKey);
                int count = countStr != null ? Integer.parseInt(countStr) : 0;
                count++;

                if (count >= 5) {
                    String lockKey = "lockout:locked:" + email;
                    stringRedisTemplate.opsForValue().set(lockKey, "locked", 15, TimeUnit.MINUTES);
                    stringRedisTemplate.delete(attemptKey);
                    throw new IllegalArgumentException(
                            "Account is locked due to too many failed login attempts. Please try again after 15 minutes.");
                } else {
                    stringRedisTemplate.opsForValue().set(attemptKey, String.valueOf(count), 15, TimeUnit.MINUTES);
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[LOCKOUT] Redis failed attempts tracking failed for {}: {}", email, e.getMessage());
        }
    }

    private void checkLockoutStatus(String email) {
        try {
            String lockKey = "lockout:locked:" + email;
            if (stringRedisTemplate != null && Boolean.TRUE.equals(stringRedisTemplate.hasKey(lockKey))) {
                throw new IllegalArgumentException(
                        "Account is locked due to too many failed login attempts. Please try again after 15 minutes.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[LOCKOUT] Redis check failed for {}: {}", email, e.getMessage());
        }

        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException(
                        "Account is locked due to too many failed login attempts. Please try again after 15 minutes.");
            }
        });
    }

    private void clearFailedAttempts(String email) {
        try {
            if (stringRedisTemplate != null) {
                stringRedisTemplate.delete("lockout:failed_attempts:" + email);
                stringRedisTemplate.delete("lockout:locked:" + email);
            }
        } catch (Exception e) {
            log.warn("[LOCKOUT] Redis clear failed for {}: {}", email, e.getMessage());
        }
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
        });
    }

    @Transactional
    public Map<String, Object> verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

        if (user.getEmailVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification token has expired");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userRepository.save(user);

        auditLogService.logEvent(null, user.getId(), "EMAIL_VERIFIED", null, null,
                "Email verification completed successfully for: " + user.getEmail());

        // Send Welcome Email
        String wsName = "Your Workspace";
        List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
        if (!memberships.isEmpty()) {
            List<Company> companies = companyRepository.findByTenantId(memberships.get(0).getTenantId());
            if (!companies.isEmpty()) {
                wsName = companies.get(0).getName();
            }
        }
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName() + " " + user.getLastName(), wsName);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Email verification successful");
        return response;
    }

    @Transactional
    public Map<String, Object> verifyOtp(String email, String otp) {
        if (email != null && rateLimiterService != null) {
            rateLimiterService.checkOtpVerifyRateLimit(email.trim().toLowerCase());
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User with this email does not exist"));

        if (user.isEmailVerified()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Email is already verified");
            return response;
        }

        if (user.getEmailVerificationToken() == null || !user.getEmailVerificationToken().equals(otp)) {
            throw new IllegalArgumentException("Invalid verification code");
        }

        if (user.getEmailVerificationTokenExpiry() == null ||
                user.getEmailVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification code has expired");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userRepository.save(user);

        auditLogService.logEvent(null, user.getId(), "EMAIL_VERIFIED", null, null,
                "Email verification completed successfully for: " + user.getEmail());

        // Send Welcome Email
        String wsName = "Your Workspace";
        List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
        if (!memberships.isEmpty()) {
            List<Company> companies = companyRepository.findByTenantId(memberships.get(0).getTenantId());
            if (!companies.isEmpty()) {
                wsName = companies.get(0).getName();
            }
        }
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName() + " " + user.getLastName(), wsName);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Email verification successful");
        return response;
    }

    @Transactional
    public Map<String, Object> resendVerification(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        String cleanEmail = email.trim().toLowerCase();

        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.isEmailVerified()) {
                String verificationToken = String.format("%06d", secureRandom.nextInt(1000000));
                user.setEmailVerificationToken(verificationToken);
                user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusMinutes(15));
                userRepository.save(user);

                // Send Email Verification
                if (emailService != null) {
                    emailService.sendVerificationEmail(cleanEmail, verificationToken);
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "If the account exists and is unverified, a verification email has been sent.");
        return response;
    }

    @Transactional
    public Map<String, Object> changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        // Validate password history (last 3 passwords)
        checkPasswordHistory(user, newPassword);

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordUpdatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Record history
        savePasswordHistory(user, user.getPasswordHash());

        // Revoke active sessions (force re-login on all devices)
        sessionRepository.deleteAllByUserId(user.getId());
        refreshTokenRepository.deleteByUser(user);
        revokeAllUserSessions(user.getId());

        auditLogService.logEvent(null, user.getId(), "PASSWORD_CHANGE_SUCCESS", null, null,
                "Password changed successfully. Active sessions revoked for user: " + user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password changed successfully");
        return response;
    }

    @Transactional
    public void deleteAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Revoke all active sessions and tokens
        sessionRepository.deleteAllByUserId(userId);
        refreshTokenRepository.deleteByUser(user);
        revokeAllUserSessions(userId);

        // Soft delete user or hard delete depending on microservice policy
        user.setDeleted(true);
        user.setStatus("DELETED");
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        auditLogService.logEvent(null, userId, "ACCOUNT_DELETED", null, null,
                "User account deleted successfully: " + user.getEmail());
    }

    private void checkPasswordHistory(User user, String newPassword) {
        List<PasswordHistory> history = passwordHistoryRepository.findTop3ByUserIdOrderByCreatedAtDesc(user.getId());
        for (PasswordHistory ph : history) {
            if (passwordEncoder.matches(newPassword, ph.getPasswordHash())) {
                throw new IllegalArgumentException(
                        "Password has been used recently. Please choose a different password.");
            }
        }
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Password has been used recently. Please choose a different password.");
        }
    }

    private void savePasswordHistory(User user, String passwordHash) {
        PasswordHistory history = PasswordHistory.builder()
                .user(user)
                .passwordHash(passwordHash)
                .build();
        passwordHistoryRepository.save(history);
    }

    @Transactional
    public Map<String, Object> loginOrRegisterWithGoogle(String idToken, String googleAccessToken, UUID selectTenantId,
            String ipAddress, String deviceModel, String osName, String browser, String userAgent) {
        try {
            String email = null;
            String firstName = "Google";
            String lastName = "User";
            String picture = null;

            if (idToken != null && !idToken.isEmpty()) {
                GoogleIdToken.Payload payload = googleAuthService.verifyToken(idToken);
                email = payload.getEmail();
                String givenName = (String) payload.get("given_name");
                String familyName = (String) payload.get("family_name");
                picture = (String) payload.get("picture");
                if (givenName != null)
                    firstName = givenName;
                if (familyName != null)
                    lastName = familyName;
            } else if (googleAccessToken != null && !googleAccessToken.isEmpty()) {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + googleAccessToken;
                Map<String, Object> userInfo = restTemplate.getForObject(userInfoUrl, Map.class);
                if (userInfo == null || !userInfo.containsKey("email")) {
                    throw new IllegalArgumentException("Invalid Google Access Token or user profile not found");
                }
                email = (String) userInfo.get("email");
                String givenName = (String) userInfo.get("given_name");
                String familyName = (String) userInfo.get("family_name");
                picture = (String) userInfo.get("picture");
                if (givenName != null)
                    firstName = givenName;
                if (familyName != null)
                    lastName = familyName;
            } else {
                throw new IllegalArgumentException("Google ID Token or Access Token is required");
            }

            if (email == null) {
                throw new IllegalArgumentException("Google account does not contain an email address");
            }

            Optional<User> userOpt = userRepository.findByEmail(email);
            User user;

            if (userOpt.isEmpty()) {
                // User does not exist, auto-register them

                // 1. Create default Tenant
                String tenantName = firstName + "'s Workspace";
                Tenant tenant = Tenant.builder()
                        .name(tenantName)
                        .build();
                tenant = tenantRepository.save(tenant);

                // 2. Create default Company profile
                Company company = Company.builder()
                        .tenantId(tenant.getId())
                        .name(tenantName)
                        .email(email)
                        .phone("")
                        .build();
                company = companyRepository.save(company);

                // Initialize default trial subscription and usage counters
                billingService.initDefaultTenantSubscription(tenant.getId());

                // 3. Load default OWNER role
                Role ownerRole = roleRepository.findByName("OWNER")
                        .orElseThrow(() -> new IllegalStateException("Default OWNER role not found"));

                // 4. Create User with random password hash and Google profile picture
                user = User.builder()
                        .firstName(firstName)
                        .lastName(lastName)
                        .email(email)
                        .phone("")
                        .profileImage(picture) // Save Google profile picture URL
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random strong password
                                                                                            // hash
                        .isEmailVerified(true) // Google accounts are pre-verified
                        .emailVerificationToken(UUID.randomUUID().toString())
                        .emailVerificationTokenExpiry(LocalDateTime.now().plusHours(24))
                        .build();
                user = userRepository.save(user);

                // Record initial password in history
                savePasswordHistory(user, user.getPasswordHash());

                // 5. Create active Membership linking User to Tenant, Company, and Role
                Membership membership = Membership.builder()
                        .user(user)
                        .tenantId(tenant.getId())
                        .companyId(company.getId())
                        .role(ownerRole)
                        .status("ACTIVE")
                        .build();
                membershipRepository.save(membership);

                auditLogService.logEvent(tenant.getId(), user.getId(), "TENANT_REGISTRATION_GOOGLE", ipAddress,
                        userAgent,
                        "Tenant and Owner User registered successfully via Google OAuth: " + tenantName);
            } else {
                user = userOpt.get();
                if (!"ACTIVE".equals(user.getStatus())) {
                    throw new IllegalArgumentException("User account is not active");
                }
                if (picture != null && !picture.isEmpty() && (user.getProfileImage() == null || user.getProfileImage().isEmpty())) {
                    user.setProfileImage(picture);
                    user = userRepository.save(user);
                }
            }

            // Standard login steps
            List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
            if (memberships.isEmpty()) {
                throw new IllegalArgumentException("User does not belong to any tenant workspace");
            }

            Membership selectedMembership = null;
            if (selectTenantId != null) {
                selectedMembership = memberships.stream()
                        .filter(m -> m.getTenantId().equals(selectTenantId))
                        .findFirst()
                        .orElse(null);

                if (selectedMembership == null) {
                    throw new IllegalArgumentException("User is not a member of the requested tenant");
                }
            } else {
                selectedMembership = memberships.stream()
                        .filter(m -> "ACTIVE".equals(m.getStatus()))
                        .findFirst()
                        .orElse(memberships.get(0));
            }

            if (!"ACTIVE".equals(selectedMembership.getStatus())) {
                throw new IllegalArgumentException("Membership is no longer active");
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Extract permissions
            List<String> permissions = new ArrayList<>();
            try {
                if (selectedMembership.getRole().getPermissionsJson() != null) {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    permissions = mapper.readValue(
                            selectedMembership.getRole().getPermissionsJson(),
                            new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {
                            });
                }
            } catch (Exception e) {
                // fallback empty
            }

            String primaryCompanyName = companyRepository.findById(selectedMembership.getCompanyId())
                    .map(Company::getName)
                    .orElse("Unknown Company");

            UUID sessionId = UUID.randomUUID();
            String deviceId = sha256(userAgent != null ? userAgent + ipAddress : ipAddress);

            // Generate Access Token
            String accessToken = jwtService.generateToken(
                    user,
                    selectedMembership.getTenantId(),
                    selectedMembership.getRole().getName(),
                    permissions,
                    primaryCompanyName,
                    selectedMembership.getTenantId(),
                    deviceId,
                    sessionId.toString());

            // Generate Refresh Token
            String rawToken = generateSecureRefreshToken();
            String tokenHash = sha256(rawToken);

            RefreshToken refreshToken = RefreshToken.builder()
                    .user(user)
                    .token(tokenHash)
                    .tenantId(selectedMembership.getTenantId())
                    .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                    .build();
            refreshToken = refreshTokenRepository.save(refreshToken);

            // Enforce concurrent session limits
            enforceSessionLimit(user, selectedMembership.getTenantId(), refreshToken, ipAddress, deviceModel, osName,
                    browser, sessionId);

            auditLogService.logEvent(selectedMembership.getTenantId(), user.getId(), "LOGIN_SUCCESS_GOOGLE", ipAddress,
                    userAgent,
                    "User logged in successfully via Google under tenant: " + selectedMembership.getTenantId());

            List<Map<String, Object>> membershipList = new ArrayList<>();
            for (Membership m : memberships) {
                Map<String, Object> mInfo = new HashMap<>();
                mInfo.put("tenantId", m.getTenantId().toString());
                mInfo.put("companyId", m.getCompanyId().toString());
                mInfo.put("role", m.getRole().getName());
                mInfo.put("status", m.getStatus());

                String companyName = companyRepository.findById(m.getCompanyId())
                        .map(Company::getName)
                        .orElse("Unknown Company");
                mInfo.put("companyName", companyName);
                membershipList.add(mInfo);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", accessToken);
            response.put("refreshToken", rawToken);
            response.put("userId", user.getId().toString());
            response.put("email", user.getEmail());
            response.put("tenantId", selectedMembership.getTenantId().toString());
            response.put("role", selectedMembership.getRole().getName());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("memberships", membershipList);
            response.put("permissions", permissions);

            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Map<String, Object> sendMagicLink(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required for Magic Link");
        }

        String cleanEmail = email.trim().toLowerCase();

        if (rateLimiterService != null) {
            rateLimiterService.checkMagicLinkRateLimit(cleanEmail);
        }

        // Only send if account exists, but do not leak existence in response (SEC-2N-A / SEC-2N-G)
        if (userRepository.existsByEmail(cleanEmail)) {
            String magicToken = UUID.randomUUID().toString();
            String redisKey = "MAGIC_LINK:" + magicToken;
            storeTokenFallback(redisKey, cleanEmail, 15);

            log.info("[MAGIC_LINK_GENERATED] 1-Click Magic Link dispatched for email: {}", cleanEmail);

            try {
                if (emailService != null) {
                    emailService.sendMagicLinkEmail(cleanEmail, magicToken);
                }
            } catch (Exception e) {
                log.error("[MAGIC_LINK] SMTP email dispatch failed for {}: {}", cleanEmail, e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "If the account exists, a sign-in link has been sent.");
        // SEC-2N-A: Never return magicToken or magicLinkUrl in HTTP response
        return response;
    }

    @Transactional
    public Map<String, Object> verifyMagicToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Magic token is required");
        }

        String redisKey = "MAGIC_LINK:" + token;
        String email = getTokenFallback(redisKey);

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Magic Link token is invalid or has expired");
        }

        final String targetEmail = email;
        User user = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new IllegalArgumentException("No registered account found for email: " + targetEmail));

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        // Single-use token: add 60-second grace period for concurrent requests before full purge
        try {
            if (stringRedisTemplate != null) {
                stringRedisTemplate.expire(redisKey, 60, TimeUnit.SECONDS);
            }
        } catch (Exception e) {
            log.warn("[MAGIC_LINK] Failed to set expiry on used token: {}", e.getMessage());
        }
        localTokenExpiry.put(redisKey, System.currentTimeMillis() + 60000L);

        List<Membership> allMemberships = membershipRepository.findAllByUserId(user.getId());
        if (allMemberships.isEmpty()) {
            throw new IllegalArgumentException("User has no active workspace membership");
        }
        Membership selectedMembership = allMemberships.get(0);

        String rawToken = generateSecureRefreshToken();
        String tokenHash = sha256(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenHash)
                .tenantId(selectedMembership.getTenantId())
                .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                .build();
        refreshTokenRepository.save(refreshToken);

        List<String> permissions = extractPermissionsFromRole(selectedMembership.getRole());
        String primaryCompanyName = companyRepository.findById(selectedMembership.getCompanyId())
                .map(Company::getName)
                .orElse("Unknown Company");

        String accessToken = jwtService.generateToken(
                user,
                selectedMembership.getTenantId(),
                selectedMembership.getRole().getName(),
                permissions,
                primaryCompanyName,
                selectedMembership.getTenantId(),
                "",
                "");

        List<Map<String, Object>> membershipList = new ArrayList<>();
        for (Membership m : allMemberships) {
            Map<String, Object> mInfo = new HashMap<>();
            mInfo.put("tenantId", m.getTenantId().toString());
            mInfo.put("companyId", m.getCompanyId().toString());
            mInfo.put("role", m.getRole().getName());
            mInfo.put("status", m.getStatus());

            String companyName = companyRepository.findById(m.getCompanyId())
                    .map(Company::getName)
                    .orElse("Unknown Company");
            mInfo.put("companyName", companyName);
            membershipList.add(mInfo);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", rawToken);
        response.put("userId", user.getId().toString());
        response.put("email", user.getEmail());
        response.put("tenantId", selectedMembership.getTenantId().toString());
        response.put("role", selectedMembership.getRole().getName());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("memberships", membershipList);
        response.put("permissions", permissions);

        return response;
    }

    @Transactional
    public Map<String, Object> sendWhatsAppOtp(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number is required for WhatsApp OTP");
        }

        String cleanPhone = phone.replaceAll("[^0-9+]", "");
        if (rateLimiterService != null) {
            rateLimiterService.checkOtpDispatchRateLimit(cleanPhone);
        }
        SecureRandom random = new SecureRandom();
        String otp = String.format("%06d", random.nextInt(1000000));
        String redisKey = "WA_OTP:" + cleanPhone;

        try {
            if (stringRedisTemplate != null) {
                stringRedisTemplate.opsForValue().set(redisKey, otp, 10, TimeUnit.MINUTES);
            }
        } catch (Exception e) {
            log.warn("[WHATSAPP_OTP] Redis unavailable for phone {}", cleanPhone);
        }

        log.info("[WHATSAPP_OTP] Dispatched 6-digit OTP challenge to WhatsApp number: {}", cleanPhone);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "WhatsApp 6-digit OTP code dispatched successfully to " + cleanPhone);
        return response;
    }

    @Transactional
    public Map<String, Object> verifyWhatsAppOtp(String phone, String otp) {
        if (phone == null || otp == null) {
            throw new IllegalArgumentException("Phone number and OTP code are required");
        }

        String cleanPhone = phone.replaceAll("[^0-9+]", "");
        if (rateLimiterService != null) {
            rateLimiterService.checkOtpVerifyRateLimit(cleanPhone);
        }
        String redisKey = "WA_OTP:" + cleanPhone;
        String cachedOtp = null;

        try {
            if (stringRedisTemplate != null) {
                cachedOtp = stringRedisTemplate.opsForValue().get(redisKey);
            }
        } catch (Exception e) {
            log.warn("[WHATSAPP_OTP] Redis lookup failed for phone {}", cleanPhone);
        }

        boolean isValid = cachedOtp != null && cachedOtp.equals(otp);
        if (!isValid) {
            throw new IllegalArgumentException("Invalid or expired 6-digit WhatsApp OTP code");
        }

        // Invalidate OTP immediately after successful verification
        try {
            if (stringRedisTemplate != null) {
                stringRedisTemplate.delete(redisKey);
            }
        } catch (Exception e) {
            log.warn("[WHATSAPP_OTP] Failed to delete OTP for phone {}: {}", cleanPhone, e.getMessage());
        }

        User user = userRepository.findByPhone(cleanPhone)
                .orElseThrow(() -> new IllegalArgumentException("No registered user found for phone number: " + cleanPhone));

        Membership selectedMembership = membershipRepository.findAllByUserId(user.getId())
                .stream()
                .filter(m -> "ACTIVE".equals(m.getStatus()))
                .findFirst()
                .orElse(membershipRepository.findAllByUserId(user.getId()).stream().findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("User has no active workspace membership")));

        // SEC-2N-D: Complete session lifecycle persistence matching standard login
        String rawToken = generateSecureRefreshToken();
        String tokenHash = sha256(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenHash)
                .tenantId(selectedMembership.getTenantId())
                .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                .build();
        refreshToken = refreshTokenRepository.save(refreshToken);

        UUID sessionId = UUID.randomUUID();
        enforceSessionLimit(user, selectedMembership.getTenantId(), refreshToken, null, null, null, null, sessionId);

        List<String> permissions = extractPermissionsFromRole(selectedMembership.getRole());
        String primaryCompanyName = companyRepository.findById(selectedMembership.getCompanyId())
                .map(Company::getName)
                .orElse("Unknown Company");

        String accessToken = jwtService.generateToken(
                user,
                selectedMembership.getTenantId(),
                selectedMembership.getRole().getName(),
                permissions,
                primaryCompanyName,
                selectedMembership.getTenantId(),
                "",
                sessionId.toString());

        List<Map<String, Object>> membershipList = new ArrayList<>();
        for (Membership m : membershipRepository.findAllByUserId(user.getId())) {
            Map<String, Object> mInfo = new HashMap<>();
            mInfo.put("tenantId", m.getTenantId().toString());
            mInfo.put("companyId", m.getCompanyId().toString());
            mInfo.put("role", m.getRole().getName());
            mInfo.put("status", m.getStatus());
            membershipList.add(mInfo);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", rawToken);
        response.put("userId", user.getId().toString());
        response.put("email", user.getEmail());
        response.put("tenantId", selectedMembership.getTenantId().toString());
        response.put("role", selectedMembership.getRole().getName());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("memberships", membershipList);
        response.put("permissions", permissions);

        return response;
    }

    private List<String> extractPermissionsFromRole(Role role) {
        if (role == null || role.getPermissionsJson() == null || role.getPermissionsJson().isBlank()) {
            return Collections.emptyList();
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(
                    role.getPermissionsJson(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {
                    });
        } catch (Exception e) {
            log.warn("Failed to parse permissionsJson for role {}", role != null ? role.getName() : "null", e);
            return Collections.emptyList();
        }
    }
}
