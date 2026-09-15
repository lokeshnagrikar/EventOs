package com.eventos.auth.config;

import com.eventos.auth.service.JwtService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * Production Security Configuration Validator.
 * 
 * Enforces fail-closed security startup validation when running in production profile.
 * Rejects missing, default, weak, or placeholder secrets across JWT, database,
 * encryption keys, gateway trust secrets, message broker, and CORS origins.
 */
@Component
public class ProductionSecurityValidator {

    private static final Logger log = LoggerFactory.getLogger(ProductionSecurityValidator.class);

    public static final Set<String> INSECURE_PLACEHOLDERS = Set.of(
        "changeme", "change-me", "password", "password123", "admin123",
        "secret", "default", "example", "placeholder", "test", "dev-secret",
        "eventos_gateway_secure_shared_secret", "eventos_secure_pass", "eventos_guest_pass",
        "eventossupersecretkeyforencryption32!", "postgres", "guest"
    );

    private final Environment env;
    private final JwtService jwtService;

    @Value("${app.gateway.secret:}")
    private String gatewaySecret;

    @Value("${app.security.encryption.key:}")
    private String encryptionKey;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${spring.rabbitmq.password:}")
    private String rabbitPassword;

    @Value("${app.cors.allowed-origins:}")
    private List<String> allowedOrigins;

    @Value("${app.security.cookie.secure:#{null}}")
    private String cookieSecure;

    @Value("${app.security.cookie.samesite:#{null}}")
    private String cookieSameSite;

    public ProductionSecurityValidator(Environment env, JwtService jwtService) {
        this.env = env;
        this.jwtService = jwtService;
    }

    @PostConstruct
    public void validateProductionSecurity() {
        if (!isProduction()) {
            return;
        }

        log.info("[SECURITY_AUDIT] Performing Fail-Closed Production Security Configuration Validation...");

        // 1. Asymmetric RS256 JWT Verification
        if (!jwtService.isRs256Configured()) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production requires asymmetric RS256 JWT key configuration. Ephemeral or symmetric configurations are rejected.");
        }

        // 2. Gateway Trust Secret Validation
        if (gatewaySecret == null || gatewaySecret.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Mandatory GATEWAY_TRUST_SECRET is missing in production.");
        }
        if (isPlaceholderOrInsecure(gatewaySecret)) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: GATEWAY_TRUST_SECRET is configured with an insecure development default or placeholder value.");
        }

        // 3. PII Encryption Key Validation
        if (encryptionKey == null || encryptionKey.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Mandatory PII encryption key 'app.security.encryption.key' is missing in production.");
        }
        if (isPlaceholderOrInsecure(encryptionKey) || encryptionKey.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: PII encryption key is insecure, default, or shorter than 32 bytes in production.");
        }

        // 4. Database Password Validation
        if (dbPassword != null && !dbPassword.trim().isEmpty()) {
            if (isPlaceholderOrInsecure(dbPassword)) {
                throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Database password cannot use obvious default or placeholder credentials in production.");
            }
        }

        // 5. RabbitMQ Password Validation
        if (rabbitPassword != null && !rabbitPassword.trim().isEmpty()) {
            if (isPlaceholderOrInsecure(rabbitPassword)) {
                throw new IllegalStateException("CRITICAL SECURITY VIOLATION: RabbitMQ password cannot use obvious default or placeholder credentials in production.");
            }
        }

        // 6. CORS Allowed Origins Validation
        if (allowedOrigins != null && !allowedOrigins.isEmpty()) {
            for (String origin : allowedOrigins) {
                if (origin.contains("localhost") || origin.contains("127.0.0.1") || origin.trim().equals("*")) {
                    throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Insecure CORS allowed origin detected in production profile: " + origin);
                }
            }
        }

        // 7. Cookie Security Configuration Validation
        if (cookieSecure != null && !cookieSecure.trim().isEmpty()) {
            String trimmedSecure = cookieSecure.trim().toLowerCase();
            if ("false".equals(trimmedSecure) || "0".equals(trimmedSecure) || "no".equals(trimmedSecure)) {
                throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production cookie secure attribute cannot be configured to false.");
            }
        }

        if (cookieSameSite != null && !cookieSameSite.trim().isEmpty()) {
            String trimmedSameSite = cookieSameSite.trim();
            if (!trimmedSameSite.equalsIgnoreCase("Lax") &&
                !trimmedSameSite.equalsIgnoreCase("Strict") &&
                !trimmedSameSite.equalsIgnoreCase("None")) {
                throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Invalid SameSite policy configured in production: " + trimmedSameSite);
            }
            if (trimmedSameSite.equalsIgnoreCase("None")) {
                if (cookieSecure != null && ("false".equalsIgnoreCase(cookieSecure.trim()) || "no".equalsIgnoreCase(cookieSecure.trim()))) {
                    throw new IllegalStateException("CRITICAL SECURITY VIOLATION: SameSite=None requires Secure=true in production.");
                }
            }
        }

        log.info("[SECURITY_AUDIT] Production Security Configuration Validation PASSED. System is fail-closed secured.");
    }

    public boolean isProduction() {
        if (env != null) {
            for (String profile : env.getActiveProfiles()) {
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

    public static boolean isPlaceholderOrInsecure(String val) {
        if (val == null || val.trim().isEmpty()) return true;
        String lower = val.trim().toLowerCase();
        return INSECURE_PLACEHOLDERS.contains(lower);
    }
}
