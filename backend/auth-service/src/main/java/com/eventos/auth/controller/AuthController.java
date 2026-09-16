package com.eventos.auth.controller;

import com.eventos.auth.dto.*;
import com.eventos.auth.service.AuthService;
import com.eventos.auth.service.RecaptchaService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.eventos.auth.config.UserPrincipal;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Tag(name = "Authentication", description = "Register a workspace, login, refresh tokens, manage passwords")
@RestController
@RequestMapping
@SuppressWarnings("null")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final RecaptchaService recaptchaService;

    @Autowired
    private com.eventos.auth.service.JwtService jwtService;

    @org.springframework.beans.factory.annotation.Value("${app.security.cookie.secure:#{null}}")
    private String secureCookieOverrideStr;

    @org.springframework.beans.factory.annotation.Value("${app.security.cookie.samesite:#{null}}")
    private String sameSitePolicyOverride;

    @org.springframework.beans.factory.annotation.Value("${app.security.cookie.domain:#{null}}")
    private String cookieDomain;

    @Autowired
    private org.springframework.core.env.Environment environment;

    @Autowired(required = false)
    private com.eventos.auth.config.ProductionSecurityValidator productionSecurityValidator;

    public boolean isProduction() {
        if (productionSecurityValidator != null) {
            return productionSecurityValidator.isProduction();
        }
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

    private ResponseCookie createRefreshTokenCookie(String token, long maxAge) {
        boolean isProd = isProduction();

        // In production, Secure MUST ALWAYS be true.
        // COOKIE_SECURE=false or app.security.cookie.secure=false CANNOT downgrade production!
        boolean secure;
        if (isProd) {
            secure = true;
        } else {
            // In non-production (local development / test):
            // Default to false for localhost HTTP compatibility, but honor explicit COOKIE_SECURE=true if configured.
            boolean secureEnv = "true".equalsIgnoreCase(System.getenv("COOKIE_SECURE"));
            boolean secureOverride = secureCookieOverrideStr != null && Boolean.parseBoolean(secureCookieOverrideStr.trim());
            secure = secureEnv || secureOverride;
        }

        String sameSite = "Lax";
        if (sameSitePolicyOverride != null && !sameSitePolicyOverride.trim().isEmpty()) {
            String candidate = sameSitePolicyOverride.trim().replace("\r", "").replace("\n", "");
            if ("Strict".equalsIgnoreCase(candidate)) {
                sameSite = "Strict";
            } else if ("None".equalsIgnoreCase(candidate)) {
                sameSite = "None";
                // SameSite=None strictly requires Secure=true in all environments per RFC 6265bis
                secure = true;
            } else {
                sameSite = "Lax";
            }
        }

        ResponseCookie.ResponseCookieBuilder cookieBuilder = ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(maxAge)
                .sameSite(sameSite);

        if (cookieDomain != null && !cookieDomain.trim().isEmpty()) {
            cookieBuilder.domain(cookieDomain.trim());
        }

        return cookieBuilder.build();
    }

    public AuthController(AuthService authService, RecaptchaService recaptchaService) {
        this.authService = authService;
        this.recaptchaService = recaptchaService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDto request) {
        try {
            Map<String, Object> result = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("EMAIL_ALREADY_EXISTS", e.getMessage()));
        } catch (Exception e) {
            log.error("[REGISTER] Unexpected error during registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("REGISTRATION_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto request, HttpServletRequest httpRequest,
            HttpServletResponse response) {
        try {
            String email = request.getEmail();
            String password = request.getPassword();
            UUID selectTenantId = request.getTenantId();

            if (email == null || password == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("BAD_REQUEST", "Email and Password are required"));
            }

            // Extract client metadata
            String ipAddress = extractClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            String deviceModel = "Browser";
            String osName = "Web Client";
            String browser = "Unknown Browser";
            if (userAgent != null) {
                if (userAgent.contains("Windows"))
                    osName = "Windows";
                else if (userAgent.contains("Macintosh"))
                    osName = "macOS";
                else if (userAgent.contains("Linux"))
                    osName = "Linux";
                else if (userAgent.contains("Android"))
                    osName = "Android";
                else if (userAgent.contains("iPhone") || userAgent.contains("iPad"))
                    osName = "iOS";

                if (userAgent.contains("Chrome")) {
                    browser = "Chrome";
                    deviceModel = "Chrome Browser";
                } else if (userAgent.contains("Safari")) {
                    browser = "Safari";
                    deviceModel = "Safari Browser";
                } else if (userAgent.contains("Firefox")) {
                    browser = "Firefox";
                    deviceModel = "Firefox Browser";
                } else if (userAgent.contains("Edge")) {
                    browser = "Edge";
                    deviceModel = "Edge Browser";
                }
            }

            Map<String, Object> authData = authService.login(
                    email, password, selectTenantId, ipAddress, deviceModel, osName, browser, userAgent,
                    request.getCaptchaId(), request.getCaptchaValue());

            if (Boolean.TRUE.equals(authData.get("requires2fa"))) {
                Map<String, Object> challengeResponse = new HashMap<>();
                challengeResponse.put("success", true);
                challengeResponse.put("requires2fa", true);
                challengeResponse.put("challengeToken", authData.get("challengeToken"));
                challengeResponse.put("message", authData.get("message"));
                return ResponseEntity.ok(challengeResponse);
            }

            String refreshToken = (String) authData.remove("refreshToken");

            ResponseCookie cookie = createRefreshTokenCookie(refreshToken, 7 * 24 * 60 * 60);

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", authData);

            return ResponseEntity.ok(successResponse);
        } catch (com.eventos.auth.exception.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            if ("CAPTCHA_REQUIRED".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("CAPTCHA_REQUIRED",
                                "CAPTCHA verification is required after 3 failed attempts"));
            }
            if ("EMAIL_UNVERIFIED".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("EMAIL_UNVERIFIED",
                                "Please verify your email address before logging in."));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("INVALID_CREDENTIALS", "Invalid email or password"));
        } catch (Exception e) {
            log.error("[LOGIN] Login execution failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("LOGIN_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verify2Fa(@RequestBody Map<String, String> request, HttpServletRequest httpRequest,
            HttpServletResponse response) {
        String challengeToken = request.get("challengeToken");
        String code = request.get("code");
        if (challengeToken == null || code == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Challenge token and code are required"));
        }

        String ipAddress = extractClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String deviceModel = "Browser";
        String osName = "Web Client";
        String browser = "Unknown Browser";

        try {
            Map<String, Object> authData = authService.verify2FaChallenge(challengeToken, code,
                    ipAddress, deviceModel, osName, browser, userAgent);

            String refreshToken = (String) authData.remove("refreshToken");
            if (refreshToken != null) {
                ResponseCookie cookie = createRefreshTokenCookie(refreshToken, 7 * 24 * 60 * 60);
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            }

            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", authData);
            return ResponseEntity.ok(successResponse);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("SECURITY_VIOLATION", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVALID_2FA_CODE", e.getMessage()));
        } catch (Exception e) {
            log.error("[2FA_VERIFY] Verification failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("VERIFICATION_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/login/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequestDto request, HttpServletRequest httpRequest,
            HttpServletResponse response) {
        try {
            String idToken = request.getIdToken();
            String accessToken = request.getAccessToken();
            UUID selectTenantId = request.getSelectTenantId();

            if ((idToken == null || idToken.isEmpty()) && (accessToken == null || accessToken.isEmpty())) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("BAD_REQUEST", "Google ID Token or Access Token is required"));
            }

            // Extract client metadata
            String ipAddress = httpRequest.getRemoteAddr();
            String xForwardedFor = httpRequest.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                ipAddress = xForwardedFor.split(",")[0].trim();
            }
            String userAgent = httpRequest.getHeader("User-Agent");
            String deviceModel = "Browser";
            String osName = "Web Client";
            String browser = "Unknown Browser";
            if (userAgent != null) {
                if (userAgent.contains("Windows"))
                    osName = "Windows";
                else if (userAgent.contains("Macintosh"))
                    osName = "macOS";
                else if (userAgent.contains("Linux"))
                    osName = "Linux";
                else if (userAgent.contains("Android"))
                    osName = "Android";
                else if (userAgent.contains("iPhone") || userAgent.contains("iPad"))
                    osName = "iOS";

                if (userAgent.contains("Chrome")) {
                    browser = "Chrome";
                    deviceModel = "Chrome Browser";
                } else if (userAgent.contains("Safari")) {
                    browser = "Safari";
                    deviceModel = "Safari Browser";
                } else if (userAgent.contains("Firefox")) {
                    browser = "Firefox";
                    deviceModel = "Firefox Browser";
                } else if (userAgent.contains("Edge")) {
                    browser = "Edge";
                    deviceModel = "Edge Browser";
                }
            }

            Map<String, Object> authData = authService.loginOrRegisterWithGoogle(
                    idToken, accessToken, selectTenantId, ipAddress, deviceModel, osName, browser, userAgent);
            String refreshToken = (String) authData.remove("refreshToken");

            ResponseCookie cookie = createRefreshTokenCookie(refreshToken, 7 * 24 * 60 * 60);

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", authData);

            return ResponseEntity.ok(successResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("INVALID_GOOGLE_TOKEN", e.getMessage()));
        } catch (Exception e) {
            log.error("[GOOGLE_LOGIN] Google login execution failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("GOOGLE_LOGIN_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            Map<String, Object> result = authService.verifyEmail(token);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVALID_TOKEN", e.getMessage()));
        } catch (Exception e) {
            log.error("[VERIFY_EMAIL] Email verification failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("VERIFICATION_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email is required"));
        }
        try {
            Map<String, Object> result = authService.resendVerification(email);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("RESEND_FAILED", e.getMessage()));
        } catch (Exception e) {
            log.error("[RESEND_VERIFICATION] Failed to resend verification email", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("RESEND_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequestDto request) {
        String email = request.getEmail();
        String otp = request.getOtp();
        if (email == null || email.isEmpty() || otp == null || otp.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email and OTP are required"));
        }
        try {
            Map<String, Object> result = authService.verifyOtp(email, otp);
            return ResponseEntity.ok(result);
        } catch (com.eventos.auth.exception.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVALID_OTP", e.getMessage()));
        } catch (Exception e) {
            log.error("[VERIFY_OTP] OTP verification failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("VERIFICATION_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            @RequestBody(required = false) Map<String, String> bodyRequest,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String token = null;
        if (cookieToken != null && !cookieToken.trim().isEmpty()) {
            token = cookieToken.trim();
        } else if (bodyRequest != null && bodyRequest.get("refreshToken") != null && !bodyRequest.get("refreshToken").trim().isEmpty()) {
            token = bodyRequest.get("refreshToken").trim();
        }

        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token"));
        }

        try {
            // Extract client metadata for session update
            String ipAddress = httpRequest.getRemoteAddr();
            String xForwardedFor = httpRequest.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                ipAddress = xForwardedFor.split(",")[0].trim();
            }
            String userAgent = httpRequest.getHeader("User-Agent");
            String deviceModel = "Browser";
            String osName = "Web Client";
            String browser = "Unknown Browser";
            if (userAgent != null) {
                if (userAgent.contains("Windows"))
                    osName = "Windows";
                else if (userAgent.contains("Macintosh"))
                    osName = "macOS";
                else if (userAgent.contains("Linux"))
                    osName = "Linux";
                else if (userAgent.contains("Android"))
                    osName = "Android";
                else if (userAgent.contains("iPhone") || userAgent.contains("iPad"))
                    osName = "iOS";

                if (userAgent.contains("Chrome")) {
                    browser = "Chrome";
                    deviceModel = "Chrome Browser";
                } else if (userAgent.contains("Safari")) {
                    browser = "Safari";
                    deviceModel = "Safari Browser";
                } else if (userAgent.contains("Firefox")) {
                    browser = "Firefox";
                    deviceModel = "Firefox Browser";
                } else if (userAgent.contains("Edge")) {
                    browser = "Edge";
                    deviceModel = "Edge Browser";
                }
            }

            Map<String, Object> result = authService.refresh(token, ipAddress, deviceModel, osName, browser, userAgent);
            String newRefreshToken = (String) result.remove("refreshToken");

            // Set rotated refresh token cookie
            ResponseCookie cookie = createRefreshTokenCookie(newRefreshToken, 7 * 24 * 60 * 60);

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", result);
            return ResponseEntity.ok(successResponse);
        } catch (SecurityException e) {
            // Replay attack detected. Invalidate cookies and fail closed with generic 401.
            ResponseCookie cookie = createRefreshTokenCookie("", 0);
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token"));
        } catch (IllegalArgumentException e) {
            ResponseCookie cookie = createRefreshTokenCookie("", 0);
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token"));
        } catch (Exception e) {
            log.error("[REFRESH] Refresh token execution failed", e);
            ResponseCookie cookie = createRefreshTokenCookie("", 0);
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token"));
        }
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            HttpServletResponse response) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("UNAUTHORIZED", "Authentication required for logout"));
        }

        String bearerToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            bearerToken = authHeader.substring(7).trim();
        }

        authService.logoutAuthenticatedUser(
                principal.getUserId(),
                principal.getTenantId(),
                cookieToken,
                bearerToken
        );

        ResponseCookie cookie = createRefreshTokenCookie("", 0);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        Map<String, Object> successResponse = new HashMap<>();
        successResponse.put("success", true);
        successResponse.put("message", "User logged out successfully");
        return ResponseEntity.ok(successResponse);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDto request, HttpServletRequest httpRequest) {
        String email = request != null ? request.getEmail() : null;
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email is required"));
        }
        try {
            String ipAddress = extractClientIp(httpRequest);
            Map<String, Object> result = authService.forgotPassword(email, ipAddress);
            return ResponseEntity.ok(result);
        } catch (com.eventos.auth.exception.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequestDto request) {
        String token = request.getToken();
        String newPassword = request.getPassword();

        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", "Token and Password are required"));
        }

        try {
            Map<String, Object> result = authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVALID_TOKEN", e.getMessage()));
        }
    }

    @PostMapping("/bootstrap/superadmin")
    public ResponseEntity<?> bootstrapSuperAdmin(
            @RequestBody AdminBootstrapDto request,
            @RequestHeader(value = "X-Bootstrap-Secret", required = false) String headerSecret,
            HttpServletRequest httpRequest) {
        try {
            String suppliedSecret = request.getBootstrapSecret() != null && !request.getBootstrapSecret().trim().isEmpty()
                    ? request.getBootstrapSecret()
                    : headerSecret;
            String ipAddress = extractClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            Map<String, Object> result = authService.bootstrapSuperAdmin(
                    request.getEmail(),
                    request.getNewPassword(),
                    suppliedSecret,
                    ipAddress,
                    userAgent);
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("BOOTSTRAP_UNAUTHORIZED", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(createErrorResponse("BOOTSTRAP_ALREADY_COMPLETED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (Exception e) {
            log.error("[ADMIN_BOOTSTRAP] Bootstrap execution failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("BOOTSTRAP_FAILED", "Bootstrap execution failed"));
        }
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getActiveSessions(
            @CookieValue(name = "refreshToken", required = false) String cookieToken) {

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("UNAUTHORIZED", "User context is missing"));
        }

        com.eventos.auth.config.UserPrincipal principal = (com.eventos.auth.config.UserPrincipal) auth.getPrincipal();
        UUID userId = principal.getUserId();
        UUID tenantId = principal.getTenantId();

        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("UNAUTHORIZED", "Tenant workspace context is missing"));
        }

        String currentHash = "";
        if (cookieToken != null) {
            try {
                java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(cookieToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hash) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1)
                        hexString.append('0');
                    hexString.append(hex);
                }
                currentHash = hexString.toString();
            } catch (Exception ignored) {
            }
        }

        List<Map<String, Object>> sessions = authService.getActiveSessions(userId, tenantId, currentHash);
        List<SessionResponseDto> dtos = sessions.stream().map(s -> SessionResponseDto.builder()
                .id(UUID.fromString((String) s.get("id")))
                .deviceModel((String) s.get("deviceModel"))
                .osName((String) s.get("osName"))
                .browser((String) s.get("browser"))
                .ipAddress((String) s.get("ipAddress"))
                .lastActiveAt((String) s.get("lastActiveAt"))
                .isCurrent((Boolean) s.get("isCurrent"))
                .build()).collect(Collectors.toList());

        Map<String, Object> successResponse = new HashMap<>();
        successResponse.put("success", true);
        successResponse.put("data", dtos);
        return ResponseEntity.ok(successResponse);
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> revokeSession(
            @PathVariable UUID id) {

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("UNAUTHORIZED", "User context is missing"));
        }

        com.eventos.auth.config.UserPrincipal principal = (com.eventos.auth.config.UserPrincipal) auth.getPrincipal();
        UUID userId = principal.getUserId();
        UUID tenantId = principal.getTenantId();

        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("UNAUTHORIZED", "Tenant workspace context is missing"));
        }

        try {
            authService.revokeSession(id, userId, tenantId);
            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("message", "Session revoked successfully");
            return ResponseEntity.ok(successResponse);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @PostMapping("/invitations")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> createInvitation(
            @RequestBody InviteRequestDto request) {
        String email = request.getEmail();
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email is required"));
        }

        String firstName = request.getFirstName();
        String lastName = request.getLastName();
        String roleName = request.getRole() != null ? request.getRole() : "STAFF";
        String phone = request.getPhone();

        // Resolve tenantId
        UUID tenantId = null;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            tenantId = ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getTenantId();
        }
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("UNAUTHORIZED", "Tenant workspace context is missing"));
        }

        // Resolve senderId
        UUID senderId = null;
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            senderId = ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getUserId();
        }

        try {
            Map<String, Object> result = authService.inviteTeamMember(tenantId, email, firstName, lastName, roleName,
                    phone, senderId);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVITATION_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<?> acceptInvite(@RequestBody AcceptInviteRequestDto request) {
        String token = request.getToken();
        String password = request.getPassword();

        if (token == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", "Token and Password are required"));
        }

        try {
            Map<String, Object> result = authService.acceptInvitation(token, password);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVALID_TOKEN", e.getMessage()));
        }
    }

    @PostMapping("/switch")
    public ResponseEntity<?> switchWorkspace(
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            @RequestBody Map<String, String> bodyRequest,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String token = null;
        if (bodyRequest != null && bodyRequest.get("refreshToken") != null && !bodyRequest.get("refreshToken").trim().isEmpty()) {
            token = bodyRequest.get("refreshToken");
        } else if (cookieToken != null && !cookieToken.trim().isEmpty()) {
            token = cookieToken;
        }

        org.springframework.security.core.Authentication currentAuth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();

        if (token == null && (currentAuth == null || !(currentAuth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("MISSING_TOKEN", "Refresh token or active session is missing"));
        }

        String tenantIdStr = bodyRequest != null ? bodyRequest.get("tenantId") : null;
        if (tenantIdStr == null || tenantIdStr.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", "Target tenantId is required"));
        }

        try {
            UUID targetTenantId = UUID.fromString(tenantIdStr);

            // Extract client metadata
            String ipAddress = httpRequest.getRemoteAddr();
            String xForwardedFor = httpRequest.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                ipAddress = xForwardedFor.split(",")[0].trim();
            }
            String userAgent = httpRequest.getHeader("User-Agent");
            String deviceModel = "Browser";
            String osName = "Web Client";
            String browser = "Unknown Browser";
            if (userAgent != null) {
                if (userAgent.contains("Windows"))
                    osName = "Windows";
                else if (userAgent.contains("Macintosh"))
                    osName = "macOS";
                else if (userAgent.contains("Linux"))
                    osName = "Linux";
                else if (userAgent.contains("Android"))
                    osName = "Android";
                else if (userAgent.contains("iPhone") || userAgent.contains("iPad"))
                    osName = "iOS";

                if (userAgent.contains("Chrome")) {
                    browser = "Chrome";
                    deviceModel = "Chrome Browser";
                } else if (userAgent.contains("Safari")) {
                    browser = "Safari";
                    deviceModel = "Safari Browser";
                } else if (userAgent.contains("Firefox")) {
                    browser = "Firefox";
                    deviceModel = "Firefox Browser";
                } else if (userAgent.contains("Edge")) {
                    browser = "Edge";
                    deviceModel = "Edge Browser";
                }
            }

            Map<String, Object> result = authService.switchWorkspace(token, targetTenantId, ipAddress, deviceModel,
                    osName, browser, userAgent);
            String newRefreshToken = (String) result.remove("refreshToken");

            // Set new refresh token cookie
            ResponseCookie cookie = createRefreshTokenCookie(newRefreshToken, 7 * 24 * 60 * 60);

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", result);

            return ResponseEntity.ok(successResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("INVALID_REQUEST", e.getMessage()));
        } catch (Exception e) {
            log.error("[SWITCH] Workspace switch execution failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("SWITCH_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/captcha")
    public ResponseEntity<?> getCaptcha() {
        Map<String, Object> data = new HashMap<>();
        boolean realRecaptchaEnabled = recaptchaService.isEnabled();
        data.put("realRecaptchaEnabled", realRecaptchaEnabled);
        if (realRecaptchaEnabled) {
            data.put("captchaId", "google_recaptcha");
        } else {
            data.put("captchaId", "mock_captcha_" + UUID.randomUUID().toString().substring(0, 8));
            data.put("imageUrl", "https://via.placeholder.com/150x50?text=MOCKCAPTCHA");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/magic-link")
    public ResponseEntity<?> sendMagicLink(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email is required"));
        }
        try {
            Map<String, Object> result = authService.sendMagicLink(email);
            return ResponseEntity.ok(result);
        } catch (com.eventos.auth.exception.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("MAGIC_LINK_FAILED", e.getMessage()));
        } catch (Exception e) {
            log.error("[MAGIC_LINK] Magic link dispatch failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("MAGIC_LINK_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/verify-magic-token")
    public ResponseEntity<?> verifyMagicToken(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String token = request.get("token");
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Magic Token is required"));
        }
        try {
            Map<String, Object> authData = authService.verifyMagicToken(token);
            String refreshToken = (String) authData.remove("refreshToken");
            if (refreshToken != null) {
                ResponseCookie cookie = createRefreshTokenCookie(refreshToken, 7 * 24 * 60 * 60);
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            }
            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", authData);
            return ResponseEntity.ok(successResponse);
        } catch (com.eventos.auth.exception.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVALID_MAGIC_TOKEN", e.getMessage()));
        } catch (Exception e) {
            log.error("[VERIFY_MAGIC_TOKEN] Verification failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("VERIFICATION_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/send-whatsapp-otp")
    public ResponseEntity<?> sendWhatsAppOtp(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        if (phone == null || phone.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Phone is required"));
        }
        try {
            Map<String, Object> result = authService.sendWhatsAppOtp(phone);
            return ResponseEntity.ok(result);
        } catch (com.eventos.auth.exception.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("WHATSAPP_OTP_FAILED", e.getMessage()));
        } catch (Exception e) {
            log.error("[WHATSAPP_OTP] WhatsApp OTP dispatch failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("WHATSAPP_OTP_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/verify-whatsapp-otp")
    public ResponseEntity<?> verifyWhatsAppOtp(@RequestBody Map<String, String> request, HttpServletResponse response) {
        String phone = request.get("phone");
        String otp = request.get("otp");
        if (phone == null || otp == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Phone and OTP are required"));
        }
        try {
            Map<String, Object> authData = authService.verifyWhatsAppOtp(phone, otp);
            String refreshToken = (String) authData.remove("refreshToken");
            if (refreshToken != null) {
                ResponseCookie cookie = createRefreshTokenCookie(refreshToken, 7 * 24 * 60 * 60);
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            }
            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", authData);
            return ResponseEntity.ok(successResponse);
        } catch (com.eventos.auth.exception.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("RATE_LIMITED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVALID_WHATSAPP_OTP", e.getMessage()));
        } catch (Exception e) {
            log.error("[VERIFY_WHATSAPP_OTP] Verification failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("VERIFICATION_FAILED", e.getMessage()));
        }
    }

    @org.springframework.beans.factory.annotation.Value("${app.rate-limiting.trusted-proxies:127.0.0.1,::1}")
    private String trustedProxies;

    private static final java.util.regex.Pattern IPV4_PATTERN = java.util.regex.Pattern.compile("^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$");
    private static final java.util.regex.Pattern IPV6_PATTERN = java.util.regex.Pattern.compile("^[0-9a-fA-F:]+$");

    private boolean isTrustedProxy(String ip) {
        if (ip == null || ip.trim().isEmpty()) return false;
        String clean = ip.trim();
        if (clean.equals("127.0.0.1") || clean.equals("::1") || clean.equals("0:0:0:0:0:0:0:1")) return true;
        if (trustedProxies != null && !trustedProxies.trim().isEmpty()) {
            for (String entry : trustedProxies.split(",")) {
                if (entry.trim().equalsIgnoreCase(clean)) return true;
            }
        }
        return false;
    }

    private boolean isValidIp(String ip) {
        if (ip == null || ip.length() > 45) return false;
        return IPV4_PATTERN.matcher(ip).matches() || (ip.contains(":") && IPV6_PATTERN.matcher(ip).matches());
    }

    public String extractClientIp(HttpServletRequest httpRequest) {
        if (httpRequest == null) return "unknown";
        String remoteIp = httpRequest.getRemoteAddr();
        if (remoteIp == null) return "unknown";

        if (isTrustedProxy(remoteIp)) {
            String xf = httpRequest.getHeader("X-Forwarded-For");
            if (xf != null && !xf.trim().isEmpty()) {
                String candidate = xf.split(",")[0].trim();
                if (isValidIp(candidate)) {
                    return candidate;
                }
            }
            String xr = httpRequest.getHeader("X-Real-IP");
            if (xr != null && !xr.trim().isEmpty()) {
                String candidate = xr.trim();
                if (isValidIp(candidate)) {
                    return candidate;
                }
            }
        }
        return remoteIp;
    }

    private Map<String, Object> createErrorResponse(String code, String message) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("code", code);
        errorDetails.put("message", message);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", errorDetails);

        return errorResponse;
    }

    /* -------------------------------------------------------------------------- */
    /* SMTP DIAGNOSTIC ENDPOINT                                                    */
    /* -------------------------------------------------------------------------- */
    @Autowired
    private com.eventos.auth.service.EmailService emailService;

    @GetMapping("/test-email")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> testEmail(@RequestParam String to) {
        log.info("[TEST_EMAIL] Sending diagnostic email to: {}", to);
        Map<String, Object> response = new HashMap<>();
        try {
            emailService.sendTestEmail(to);
            response.put("success", true);
            response.put("message", "Test email dispatched to " + to + ". Check inbox & spam.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[TEST_EMAIL] SMTP dispatch failed to {}: {}", to, e.getMessage(), e);
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
