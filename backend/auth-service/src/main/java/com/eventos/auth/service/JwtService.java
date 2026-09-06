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

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            if (rawPrivateKey == null || rawPrivateKey.isEmpty() || rawPublicKey == null || rawPublicKey.isEmpty()) {
                String keyPath = System.getenv().getOrDefault("JWT_KEY_PATH", ".");
                java.io.File privateKeyFile = new java.io.File(keyPath, "jwt_private.pem");
                java.io.File publicKeyFile = new java.io.File(keyPath, "jwt_public.pem");

                if (!privateKeyFile.exists()) {
                    java.io.File parentTry = new java.io.File("../jwt_private.pem");
                    if (parentTry.exists()) {
                        privateKeyFile = parentTry;
                        publicKeyFile = new java.io.File("../jwt_public.pem");
                    }
                }
                if (!privateKeyFile.exists()) {
                    java.io.File doubleParentTry = new java.io.File("../../jwt_private.pem");
                    if (doubleParentTry.exists()) {
                        privateKeyFile = doubleParentTry;
                        publicKeyFile = new java.io.File("../../jwt_public.pem");
                    }
                }
                if (!privateKeyFile.exists()) {
                    java.io.File absoluteTry = new java.io.File("d:/EventOs/jwt_private.pem");
                    if (absoluteTry.exists()) {
                        privateKeyFile = absoluteTry;
                        publicKeyFile = new java.io.File("d:/EventOs/jwt_public.pem");
                    }
                }

                if (privateKeyFile.exists() && publicKeyFile.exists()) {
                    String privatePem = java.nio.file.Files.readString(privateKeyFile.toPath());
                    String publicPem = java.nio.file.Files.readString(publicKeyFile.toPath());
                    this.privateKey = parsePrivateKey(privatePem);
                    this.publicKey = parsePublicKey(publicPem);
                } else if (jwtSecret != null && !jwtSecret.trim().isEmpty() && jwtSecret.length() >= 32) {
                    if ("9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d".equals(jwtSecret.trim())) {
                        String profile = System.getenv("SPRING_PROFILES_ACTIVE");
                        if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                            throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Default development JWT secret detected in production environment! Configure a unique, rotated JWT_SECRET_KEY in production.");
                        }
                    }
                    byte[] secretBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    this.symmetricKey = io.jsonwebtoken.security.Keys.hmacShaKeyFor(secretBytes);
                    this.useSymmetric = true;
                } else {
                    KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                    keyGen.initialize(2048);
                    KeyPair keyPair = keyGen.generateKeyPair();
                    this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
                    this.publicKey = (RSAPublicKey) keyPair.getPublic();
                }
            } else {
                this.privateKey = parsePrivateKey(rawPrivateKey);
                this.publicKey = parsePublicKey(rawPublicKey);
            }
            io.jsonwebtoken.JwtParserBuilder parserBuilder = Jwts.parser();
            if (useSymmetric) {
                parserBuilder.verifyWith(symmetricKey);
            } else {
                parserBuilder.verifyWith(publicKey);
            }
            this.jwtParser = parserBuilder.build();
        } catch (Exception e) {
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

        if (useSymmetric) {
            return Jwts.builder()
                    .claims(claims)
                    .subject(user.getEmail())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                    .signWith(symmetricKey, Jwts.SIG.HS256)
                    .compact();
        } else {
            return Jwts.builder()
                    .claims(claims)
                    .subject(user.getEmail())
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
