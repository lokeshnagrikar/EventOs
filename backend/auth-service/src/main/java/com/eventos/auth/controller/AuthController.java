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
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

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

            Map<String, Object> authData = authService.login(
                    email, password, selectTenantId, ipAddress, deviceModel, osName, browser, userAgent,
                    request.getCaptchaId(), request.getCaptchaValue());
            String refreshToken = (String) authData.get("refreshToken");

            ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false) // Set to true in prod with SSL
                    .path("/api/v1/auth")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            authData.remove("refreshToken");

            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", authData);

            return ResponseEntity.ok(successResponse);
        } catch (IllegalArgumentException e) {
            if ("CAPTCHA_REQUIRED".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("CAPTCHA_REQUIRED",
                                "CAPTCHA verification is required after 3 failed attempts"));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("INVALID_CREDENTIALS", e.getMessage()));
        } catch (Exception e) {
            log.error("[LOGIN] Login execution failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("LOGIN_FAILED", e.getMessage()));
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
            String refreshToken = (String) authData.get("refreshToken");

            ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false) // Set to true in prod with SSL
                    .path("/api/v1/auth")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            authData.remove("refreshToken");

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

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            @RequestBody(required = false) Map<String, String> bodyRequest,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String token = null;
        if (cookieToken != null) {
            token = cookieToken;
        } else if (bodyRequest != null && bodyRequest.get("refreshToken") != null) {
            token = bodyRequest.get("refreshToken");
        }

        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("MISSING_TOKEN", "Refresh token is missing"));
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
            String newRefreshToken = (String) result.get("refreshToken");

            // Set rotated refresh token cookie
            ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefreshToken)
                    .httpOnly(true)
                    .secure(false) // Set to true in prod with SSL
                    .path("/api/v1/auth")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            result.remove("refreshToken");

            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("data", result);
            return ResponseEntity.ok(successResponse);
        } catch (SecurityException e) {
            // Replay attack detected. Invalidate cookies.
            ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                    .httpOnly(true)
                    .path("/api/v1/auth")
                    .maxAge(0)
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("REPLAY_ATTACK_DETECTED", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("INVALID_TOKEN", e.getMessage()));
        } catch (Exception e) {
            log.error("[REFRESH] Refresh token execution failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("REFRESH_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            @RequestBody(required = false) Map<String, String> request,
            HttpServletResponse response) {

        String email = request != null ? request.get("email") : null;
        if (email != null) {
            authService.logout(email);
        } else if (cookieToken != null) {
            authService.logoutByToken(cookieToken);
        }

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService != null) {
                jwtService.blacklistToken(token);
            }
        }

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .path("/api/v1/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        Map<String, Object> successResponse = new HashMap<>();
        successResponse.put("success", true);
        successResponse.put("message", "User logged out successfully");
        return ResponseEntity.ok(successResponse);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDto request) {
        String email = request.getEmail();
        if (email == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email is required"));
        }
        try {
            Map<String, Object> result = authService.forgotPassword(email);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("USER_NOT_FOUND", e.getMessage()));
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

    @GetMapping("/sessions")
    public ResponseEntity<?> getActiveSessions(
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("UNAUTHORIZED", "User context is missing"));
        }

        com.eventos.auth.config.UserPrincipal principal = (com.eventos.auth.config.UserPrincipal) auth.getPrincipal();
        UUID userId = principal.getUserId();
        UUID tenantId = principal.getTenantId();

        if (tenantId == null && tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
            tenantId = UUID.fromString(tenantIdHeader);
        }

        if (tenantId == null) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", "Tenant workspace context is missing"));
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
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("UNAUTHORIZED", "User context is missing"));
        }

        com.eventos.auth.config.UserPrincipal principal = (com.eventos.auth.config.UserPrincipal) auth.getPrincipal();
        UUID userId = principal.getUserId();
        UUID tenantId = principal.getTenantId();

        if (tenantId == null && tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
            tenantId = UUID.fromString(tenantIdHeader);
        }

        if (tenantId == null) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", "Tenant workspace context is missing"));
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
            @RequestBody InviteRequestDto request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
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
        if (tenantId == null && tenantIdHeader != null && !tenantIdHeader.isEmpty()) {
            tenantId = UUID.fromString(tenantIdHeader);
        }
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", "Tenant workspace context is missing"));
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
        if (cookieToken != null) {
            token = cookieToken;
        } else if (bodyRequest != null && bodyRequest.get("refreshToken") != null) {
            token = bodyRequest.get("refreshToken");
        }

        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("MISSING_TOKEN", "Refresh token is missing"));
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
            String newRefreshToken = (String) result.get("refreshToken");

            // Set new refresh token cookie
            ResponseCookie cookie = ResponseCookie.from("refreshToken", newRefreshToken)
                    .httpOnly(true)
                    .secure(false) // Set to true in prod with SSL
                    .path("/api/v1/auth")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            result.remove("refreshToken");

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

    private Map<String, Object> createErrorResponse(String code, String message) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("code", code);
        errorDetails.put("message", message);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", errorDetails);

        return errorResponse;
    }
}
