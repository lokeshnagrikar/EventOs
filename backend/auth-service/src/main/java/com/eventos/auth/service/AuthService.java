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

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.security.log-tokens:false}")
    private boolean logTokens;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
            TenantRepository tenantRepository, CompanyRepository companyRepository,
            RefreshTokenRepository refreshTokenRepository, MembershipRepository membershipRepository,
            SessionRepository sessionRepository, InvitationRepository invitationRepository,
            PasswordHistoryRepository passwordHistoryRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService,
            StringRedisTemplate stringRedisTemplate, AuditLogService auditLogService,
            RecaptchaService recaptchaService, GoogleAuthService googleAuthService) {
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

        // 3. Load OWNER role
        Role ownerRole = roleRepository.findByName("OWNER")
                .orElseThrow(() -> new IllegalStateException("Default OWNER role not found"));

        // 4. Create Owner User
        String verificationToken = UUID.randomUUID().toString();
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(email)
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isEmailVerified(true)  // Auto-verified for dev; set to false when email server is configured
                .emailVerificationToken(verificationToken)
                .emailVerificationTokenExpiry(LocalDateTime.now().plusHours(24))
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

        auditLogService.logEvent(tenant.getId(), user.getId(), "TENANT_REGISTRATION", null, null,
                "Tenant and Owner User registered successfully: " + tenantName);

        if (logTokens) {
            System.out.println("=================================================");
            System.out.println("EMAIL VERIFICATION CREATED FOR: " + email);
            System.out.println("VERIFICATION TOKEN: " + verificationToken);
            System.out.println("=================================================");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("verificationToken", verificationToken);
        result.put("message", "Tenant and Owner User registered successfully");
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
        if (ipAddress != null) {
            checkRateLimit(ipAddress);
        }

        checkLockoutStatus(email);

        // CAPTCHA check after 3 failed attempts
        String attemptKey = "lockout:failed_attempts:" + email;
        String countStr = stringRedisTemplate.opsForValue().get(attemptKey);
        int count = countStr != null ? Integer.parseInt(countStr) : 0;
        if (count >= 3) {
            if (!recaptchaService.verifyToken(captchaValue, ipAddress)) {
                throw new IllegalArgumentException("CAPTCHA_REQUIRED");
            }
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            handleFailedLoginAttempt(email);
            auditLogService.logEvent(null, null, "LOGIN_FAILURE", ipAddress, userAgent,
                    "Failed login. Email not found: " + email);
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!"ACTIVE".equals(user.getStatus())) {
            auditLogService.logEvent(null, user.getId(), "LOGIN_FAILURE", ipAddress, userAgent,
                    "Failed login. Account inactive: " + email);
            throw new IllegalArgumentException("User account is not active");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            handleFailedLoginAttempt(email);
            auditLogService.logEvent(null, user.getId(), "LOGIN_FAILURE", ipAddress, userAgent,
                    "Failed login. Password mismatch for user: " + email);
            throw new IllegalArgumentException("Invalid email or password");
        }

        clearFailedAttempts(email);

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
                throw new IllegalArgumentException("User is not a member of the requested tenant");
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
            throw new IllegalArgumentException("Membership is no longer active");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Email Verification Check (skipped — auto-verified on registration)
        // Re-enable when a real mail server is configured:
        // if (!user.isEmailVerified()) {
        //     throw new IllegalArgumentException("EMAIL_UNVERIFIED");
        // }

        // Password Expiration Check (90 days)
        if (user.getPasswordUpdatedAt() != null && user.getPasswordUpdatedAt().plusDays(90).isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("PASSWORD_EXPIRED");
        }

        // Extract permissions
        List<String> permissions = new ArrayList<>();
        try {
            if (selectedMembership.getRole().getPermissionsJson() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                permissions = mapper.readValue(
                    selectedMembership.getRole().getPermissionsJson(), 
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                );
            }
        } catch (Exception e) {
            // fallback empty
        }

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
            sessionId.toString()
        );

        // Refresh Token
        String rawToken = UUID.randomUUID().toString();
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
        response.put("memberships", membershipList);
        response.put("permissions", permissions);
        return response;
    }

    @Transactional
    public Map<String, Object> refresh(String token, String ipAddress, String deviceModel, String osName,
            String browser, String userAgent) {
        String presentedHash = sha256(token);

        Optional<RefreshToken> activeTokenOpt = refreshTokenRepository.findByToken(presentedHash);
        if (activeTokenOpt.isEmpty()) {
            // Replay Attack Detection: check Redis for breach history
            String redisKey = "rotated:token:" + presentedHash;
            String userIdStr = stringRedisTemplate.opsForValue().get(redisKey);
            if (userIdStr != null) {
                UUID userId = UUID.fromString(userIdStr);
                sessionRepository.deleteAllByUserId(userId);
                refreshTokenRepository.deleteByUser(User.builder().id(userId).build());
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
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                );
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
            sessionId.toString()
        );

        // Rotate Refresh Token
        String newRawToken = UUID.randomUUID().toString();
        String newHash = sha256(newRawToken);

        // Store old hash in Redis for breach history (1 hour TTL)
        String redisKey = "rotated:token:" + presentedHash;
        stringRedisTemplate.opsForValue().set(redisKey, user.getId().toString(), 1, TimeUnit.HOURS);

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
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email address not found"));

        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String resetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String tokenHash = sha256(resetToken);

        String redisKey = "reset:token:" + tokenHash;
        stringRedisTemplate.opsForValue().set(redisKey, user.getEmail(), 15, TimeUnit.MINUTES);

        auditLogService.logEvent(null, user.getId(), "PASSWORD_RESET_REQUEST", null, null,
                "Password reset token generated for user: " + email);

        if (logTokens) {
            System.out.println("=================================================");
            System.out.println("PASSWORD RESET REQUESTED FOR: " + email);
            System.out.println("RESET TOKEN: " + resetToken);
            System.out.println("=================================================");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Reset token generated successfully. Check system logs.");
        return response;
    }

    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword) {
        String tokenHash = sha256(token);
        String redisKey = "reset:token:" + tokenHash;
        String email = stringRedisTemplate.opsForValue().get(redisKey);
        if (email == null) {
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User associated with token not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        stringRedisTemplate.delete(redisKey);

        // Force logout on all active sessions on password change
        sessionRepository.deleteAllByUserId(user.getId());
        refreshTokenRepository.deleteByUser(user);

        auditLogService.logEvent(null, user.getId(), "PASSWORD_RESET_SUCCESS", null, null,
                "Password reset successfully. Active sessions revoked for user: " + email);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password has been reset successfully");
        return response;
    }

    @Transactional
    public Map<String, Object> inviteTeamMember(UUID tenantId, String email, String firstName, String lastName,
            String roleName, String phone, UUID senderId) {
        Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));

        List<Company> companies = companyRepository.findByTenantId(tenantId);
        UUID companyId = companies.isEmpty() ? tenantId : companies.get(0).getId();

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

            auditLogService.logEvent(tenantId, senderId, "INVITATION_SENT", null, null,
                    "Invitation sent to existing user email: " + email + " for role: " + roleName);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Invitation sent to existing user");
            result.put("inviteToken", rawToken);
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

            auditLogService.logEvent(tenantId, senderId, "INVITATION_SENT", null, null,
                    "Invitation sent to new pending user: " + email + " for role: " + roleName);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "New user invited in PENDING status");
            result.put("inviteToken", rawToken);
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

        user.setStatus("ACTIVE");
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);

        Membership membership = membershipRepository.findByUserIdAndTenantId(user.getId(), invitation.getTenantId())
                .orElseThrow(() -> new IllegalStateException("Membership associated with invitation not found"));
        membership.setStatus("ACTIVE");
        membershipRepository.save(membership);

        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        auditLogService.logEvent(invitation.getTenantId(), user.getId(), "INVITATION_ACCEPTED", null, null,
                "Invitation accepted. User activated: " + invitation.getEmail());

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Invitation accepted and account activated");
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

        if (logTokens) {
            System.out.println("=================================================");
            System.out.println("TEAM INVITATION CREATED FOR: " + email);
            System.out.println("INVITATION TOKEN: " + rawToken);
            System.out.println("=================================================");
        }

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
                limit = 1;
            } else if ("GROWTH".equalsIgnoreCase(plan)) {
                limit = 3;
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

        sessionRepository.delete(session);
        refreshTokenRepository.delete(session.getRefreshToken());
        auditLogService.logEvent(tenantId, userId, "SESSION_REVOKED", null, null,
                "Active session revoked manually: " + sessionId);
    }

    @Transactional
    public Map<String, Object> switchWorkspace(String rawRefreshToken, UUID targetTenantId,
            String ipAddress, String deviceModel, String osName, String browser, String userAgent) {
        String presentedHash = sha256(rawRefreshToken);
        RefreshToken oldToken = refreshTokenRepository.findByToken(presentedHash)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        User user = oldToken.getUser();

        Membership membership = membershipRepository.findByUserIdAndTenantId(user.getId(), targetTenantId)
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of target tenant"));

        if (!"ACTIVE".equals(membership.getStatus())) {
            throw new IllegalArgumentException("Membership in target tenant is not active");
        }

        sessionRepository.deleteByRefreshTokenId(oldToken.getId());
        refreshTokenRepository.delete(oldToken);

        // Extract permissions
        List<String> permissions = new ArrayList<>();
        try {
            if (membership.getRole().getPermissionsJson() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                permissions = mapper.readValue(
                    membership.getRole().getPermissionsJson(), 
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                );
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
            sessionId.toString()
        );

        String newRawToken = UUID.randomUUID().toString();
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
        response.put("memberships", membershipList);
        response.put("permissions", permissions);
        return response;
    }

    private String sha256(String data) {
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
        String key = "rate:limit:ip:" + ipAddress;
        String countStr = stringRedisTemplate.opsForValue().get(key);
        int count = countStr != null ? Integer.parseInt(countStr) : 0;

        if (count >= 100) {
            throw new IllegalStateException("Too many requests from this IP. Please try again later.");
        }

        if (count == 0) {
            stringRedisTemplate.opsForValue().set(key, "1", 1, TimeUnit.MINUTES);
        } else {
            stringRedisTemplate.opsForValue().increment(key);
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

        String attemptKey = "lockout:failed_attempts:" + email;
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

    private void checkLockoutStatus(String email) {
        String lockKey = "lockout:locked:" + email;
        if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(lockKey))) {
            throw new IllegalArgumentException(
                    "Account is locked due to too many failed login attempts. Please try again after 15 minutes.");
        }

        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException(
                        "Account is locked due to too many failed login attempts. Please try again after 15 minutes.");
            }
        });
    }

    private void clearFailedAttempts(String email) {
        stringRedisTemplate.delete("lockout:failed_attempts:" + email);
        stringRedisTemplate.delete("lockout:locked:" + email);
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

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Email verification successful");
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
                throw new IllegalArgumentException("Password has been used recently. Please choose a different password.");
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

            if (idToken != null && !idToken.isEmpty()) {
                GoogleIdToken.Payload payload = googleAuthService.verifyToken(idToken);
                email = payload.getEmail();
                String givenName = (String) payload.get("given_name");
                String familyName = (String) payload.get("family_name");
                if (givenName != null) firstName = givenName;
                if (familyName != null) lastName = familyName;
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
                if (givenName != null) firstName = givenName;
                if (familyName != null) lastName = familyName;
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

                // 3. Load default OWNER role
                Role ownerRole = roleRepository.findByName("OWNER")
                        .orElseThrow(() -> new IllegalStateException("Default OWNER role not found"));

                // 4. Create User with random password hash
                user = User.builder()
                        .firstName(firstName)
                        .lastName(lastName)
                        .email(email)
                        .phone("")
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random strong password hash
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

                auditLogService.logEvent(tenant.getId(), user.getId(), "TENANT_REGISTRATION_GOOGLE", ipAddress, userAgent,
                        "Tenant and Owner User registered successfully via Google OAuth: " + tenantName);
            } else {
                user = userOpt.get();
                if (!"ACTIVE".equals(user.getStatus())) {
                    throw new IllegalArgumentException("User account is not active");
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
                        new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                    );
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
                sessionId.toString()
            );

            // Generate Refresh Token
            String rawToken = UUID.randomUUID().toString();
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

            auditLogService.logEvent(selectedMembership.getTenantId(), user.getId(), "LOGIN_SUCCESS_GOOGLE", ipAddress, userAgent,
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
            response.put("tenantId", selectedMembership.getTenantId().toString());
            response.put("role", selectedMembership.getRole().getName());
            response.put("firstName", user.getFirstName());
            response.put("memberships", membershipList);
            response.put("permissions", permissions);

            return response;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed: " + e.getMessage(), e);
        }
    }
}
