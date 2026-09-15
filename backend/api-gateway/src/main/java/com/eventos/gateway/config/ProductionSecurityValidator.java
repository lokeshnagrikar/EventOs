package com.eventos.gateway.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

/**
 * Production Security Configuration Validator for API Gateway.
 * 
 * Enforces fail-closed security startup validation when running in production profile.
 * Verifies that the API Gateway has non-default gateway trust secrets, valid RS256
 * public keys, and secure CORS origins.
 */
@Component
public class ProductionSecurityValidator {

    private static final Logger log = LoggerFactory.getLogger(ProductionSecurityValidator.class);

    public static final Set<String> INSECURE_PLACEHOLDERS = Set.of(
        "changeme", "change-me", "password", "password123", "admin123",
        "secret", "default", "example", "placeholder", "test", "dev-secret",
        "eventos_gateway_secure_shared_secret", "eventos_secure_pass", "eventos_guest_pass"
    );

    private final Environment env;
    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.gateway.secret:}")
    private String gatewaySecret;

    @Value("${CORS_ALLOWED_ORIGINS:}")
    private String corsAllowedOrigins;

    public ProductionSecurityValidator(Environment env, JwtAuthFilter jwtAuthFilter) {
        this.env = env;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @PostConstruct
    public void validateProductionSecurity() {
        if (!isProduction()) {
            return;
        }

        log.info("[SECURITY_AUDIT] Gateway: Performing Fail-Closed Production Security Configuration Validation...");

        // 1. Asymmetric RS256 Public Key Verification
        if (!jwtAuthFilter.isRs256Configured()) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Gateway in production requires asymmetric RS256 JWT public key configuration. Ephemeral or symmetric configurations are rejected.");
        }

        // 2. Gateway Trust Secret Validation
        if (gatewaySecret == null || gatewaySecret.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Mandatory GATEWAY_TRUST_SECRET is missing in production Gateway.");
        }
        if (isPlaceholderOrInsecure(gatewaySecret)) {
            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Gateway GATEWAY_TRUST_SECRET is configured with an insecure development default or placeholder value.");
        }

        // 3. CORS Allowed Origins Validation
        if (corsAllowedOrigins != null && !corsAllowedOrigins.trim().isEmpty()) {
            String[] origins = corsAllowedOrigins.split(",");
            for (String origin : origins) {
                String trimmed = origin.trim();
                if (trimmed.contains("localhost") || trimmed.contains("127.0.0.1") || trimmed.equals("*")) {
                    throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Insecure Gateway CORS allowed origin detected in production profile: " + trimmed);
                }
            }
        }

        log.info("[SECURITY_AUDIT] Gateway: Production Security Configuration Validation PASSED.");
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
