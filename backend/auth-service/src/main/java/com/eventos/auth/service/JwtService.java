package com.eventos.auth.service;

import com.eventos.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class JwtService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtService.class);

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.jwt.private-key:}")
    private String rawPrivateKey;

    @Value("${app.jwt.public-key:}")
    private String rawPublicKey;

    private RSAPrivateKey privateKey;
    private RSAPublicKey publicKey;
    private io.jsonwebtoken.JwtParser jwtParser;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    private javax.crypto.SecretKey symmetricKey;
    private boolean useSymmetric = false;
    private boolean isEphemeral = false;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.core.env.Environment env;

    public boolean isRs256Configured() {
        return !useSymmetric && privateKey != null && publicKey != null && !isEphemeral;
    }

    public boolean isSymmetric() {
        return useSymmetric;
    }

    public boolean isEphemeral() {
        return isEphemeral;
    }

    private boolean isProductionProfile() {
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

    @jakarta.annotation.PostConstruct
    public void init() {
        boolean isProd = isProductionProfile();
        try {
            if (isProd) {
                if (rawPrivateKey != null && !rawPrivateKey.trim().isEmpty() && rawPublicKey != null && !rawPublicKey.trim().isEmpty()) {
                    this.privateKey = parsePrivateKey(rawPrivateKey);
                    this.publicKey = parsePublicKey(rawPublicKey);
                } else if (System.getenv("JWT_KEY_PATH") != null) {
                    String keyPath = System.getenv("JWT_KEY_PATH");
                    java.io.File privateKeyFile = new java.io.File(keyPath, "jwt_private.pem");
                    java.io.File publicKeyFile = new java.io.File(keyPath, "jwt_public.pem");
                    if (privateKeyFile.exists() && publicKeyFile.exists()) {
                        String privatePem = java.nio.file.Files.readString(privateKeyFile.toPath());
                        String publicPem = java.nio.file.Files.readString(publicKeyFile.toPath());
                        this.privateKey = parsePrivateKey(privatePem);
                        this.publicKey = parsePublicKey(publicPem);
                    } else {
                        throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production requires explicit RS256 key configuration (JWT_PRIVATE_KEY and JWT_PUBLIC_KEY). Key files not found in JWT_KEY_PATH: " + keyPath);
                    }
                } else {
                    throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production requires explicit RS256 key configuration (JWT_PRIVATE_KEY and JWT_PUBLIC_KEY). Insecure fallbacks and ephemeral keys are prohibited.");
                }
            } else {
                if (rawPrivateKey != null && !rawPrivateKey.isEmpty() && rawPublicKey != null && !rawPublicKey.isEmpty()) {
                    this.privateKey = parsePrivateKey(rawPrivateKey);
                    this.publicKey = parsePublicKey(rawPublicKey);
                } else if (System.getenv("JWT_KEY_PATH") != null) {
                    String keyPath = System.getenv("JWT_KEY_PATH");
                    java.io.File privateKeyFile = new java.io.File(keyPath, "jwt_private.pem");
                    java.io.File publicKeyFile = new java.io.File(keyPath, "jwt_public.pem");

                    if (privateKeyFile.exists() && publicKeyFile.exists()) {
                        String privatePem = java.nio.file.Files.readString(privateKeyFile.toPath());
                        String publicPem = java.nio.file.Files.readString(publicKeyFile.toPath());
                        this.privateKey = parsePrivateKey(privatePem);
                        this.publicKey = parsePublicKey(publicPem);
                    } else {
                        log.warn("JWT_KEY_PATH configured but PEM files missing in: {}. Generating ephemeral keypair.", keyPath);
                        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                        keyGen.initialize(2048);
                        KeyPair keyPair = keyGen.generateKeyPair();
                        this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
                        this.publicKey = (RSAPublicKey) keyPair.getPublic();
                        this.isEphemeral = true;
                    }
                } else if (jwtSecret != null && !jwtSecret.trim().isEmpty() && jwtSecret.length() >= 32) {
                    byte[] secretBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    this.symmetricKey = io.jsonwebtoken.security.Keys.hmacShaKeyFor(secretBytes);
                    this.useSymmetric = true;
                } else {
                    KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                    keyGen.initialize(2048);
                    KeyPair keyPair = keyGen.generateKeyPair();
                    this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
                    this.publicKey = (RSAPublicKey) keyPair.getPublic();
                    this.isEphemeral = true;
                }
            }

            io.jsonwebtoken.JwtParserBuilder parserBuilder = Jwts.parser();
            if (useSymmetric) {
                parserBuilder.verifyWith(symmetricKey);
            } else {
                parserBuilder.verifyWith(publicKey);
            }
            this.jwtParser = parserBuilder.build();
        } catch (Exception e) {
            if (e instanceof IllegalStateException) {
                throw (IllegalStateException) e;
            }
            throw new RuntimeException("Failed to initialize JWT Cryptographic Keys", e);
        }
    }

    public String generateToken(User user, java.util.UUID tenantId, String role) {
        return generateToken(user, tenantId, role, java.util.Collections.emptyList(), "", tenantId, "", "");
    }

    public String generateToken(User user, java.util.UUID tenantId, String role, 
                                 java.util.List<String> permissions, String companyName, 
                                 java.util.UUID workspaceId, String deviceId, String sessionId) {
        return generateToken(user, tenantId, role, permissions, companyName, workspaceId, deviceId, sessionId, false);
    }

    public String generateToken(User user, java.util.UUID tenantId, String role, 
                                 java.util.List<String> permissions, String companyName, 
                                 java.util.UUID workspaceId, String deviceId, String sessionId,
                                 boolean impersonated) {
        return generateToken(user, tenantId, role, permissions, companyName, workspaceId, deviceId, sessionId, impersonated, null);
    }

    public String generateToken(User user, java.util.UUID tenantId, String role, 
                                 java.util.List<String> permissions, String companyName, 
                                 java.util.UUID workspaceId, String deviceId, String sessionId,
                                 boolean impersonated, java.util.UUID adminUserId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tenantId", tenantId.toString());
        claims.put("userId", user.getId().toString());
        claims.put("roles", role);
        claims.put("permissions", permissions);
        claims.put("companyName", companyName != null ? companyName : "");
        claims.put("workspaceId", workspaceId != null ? workspaceId.toString() : tenantId.toString());
        claims.put("deviceId", deviceId != null ? deviceId : "");
        claims.put("sessionId", sessionId != null ? sessionId : "");
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("email", user.getEmail());
        claims.put("impersonated", impersonated);
        if (impersonated && adminUserId != null) {
            claims.put("adminUserId", adminUserId.toString());
        }

        if (useSymmetric) {
            return Jwts.builder()
                    .claims(claims)
                    .subject(user.getEmail())
                    .issuer("eventos-auth-service")
                    .audience().add("eventos-platform").and()
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                    .signWith(symmetricKey, Jwts.SIG.HS256)
                    .compact();
        } else {
            return Jwts.builder()
                    .claims(claims)
                    .subject(user.getEmail())
                    .issuer("eventos-auth-service")
                    .audience().add("eventos-platform").and()
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                    .signWith(privateKey, Jwts.SIG.RS256)
                    .compact();
        }
    }

    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            if (isTokenBlacklisted(token)) {
                return false;
            }
            jwtParser.parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void blacklistToken(String token) {
        if (redisTemplate == null) {
            return;
        }
        try {
            Claims claims = getClaims(token);
            Date expiration = claims.getExpiration();
            long ttlMs = expiration.getTime() - System.currentTimeMillis();
            if (ttlMs > 0) {
                // To match gateway: "blacklist:" + token
                String key = "blacklist:" + token;
                redisTemplate.opsForValue().set(key, "blacklisted", ttlMs, TimeUnit.MILLISECONDS);
            }
        } catch (Exception e) {
            // Ignore if parsing/redis fails
        }
    }

    public boolean isTokenBlacklisted(String token) {
        if (redisTemplate == null) {
            return false;
        }
        try {
            String key = "blacklist:" + token;
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return jwtParser.parseSignedClaims(token).getPayload();
    }

    private RSAPrivateKey parsePrivateKey(String pem) throws Exception {
        String key = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    private RSAPublicKey parsePublicKey(String pem) throws Exception {
        String key = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(key);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);
    }
}
