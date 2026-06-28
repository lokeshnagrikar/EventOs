package com.eventos.auth.service;

import com.eventos.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

@Service
public class JwtService {

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.jwt.private-key:}")
    private String rawPrivateKey;

    @Value("${app.jwt.public-key:}")
    private String rawPublicKey;

    private RSAPrivateKey privateKey;
    private RSAPublicKey publicKey;
    private io.jsonwebtoken.JwtParser jwtParser;

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
                } else {
                    KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                    keyGen.initialize(2048);
                    KeyPair keyPair = keyGen.generateKeyPair();
                    this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
                    this.publicKey = (RSAPublicKey) keyPair.getPublic();

                    // Ensure directory exists
                    java.io.File parentDir = privateKeyFile.getParentFile();
                    if (parentDir != null && !parentDir.exists()) {
                        parentDir.mkdirs();
                    }

                    // Write them to files
                    String privatePem = "-----BEGIN PRIVATE KEY-----\n" +
                            Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(privateKey.getEncoded()) +
                            "\n-----END PRIVATE KEY-----";
                    java.nio.file.Files.writeString(privateKeyFile.toPath(), privatePem);

                    String publicPem = "-----BEGIN PUBLIC KEY-----\n" +
                            Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(publicKey.getEncoded()) +
                            "\n-----END PUBLIC KEY-----";
                    java.nio.file.Files.writeString(publicKeyFile.toPath(), publicPem);
                }
            } else {
                this.privateKey = parsePrivateKey(rawPrivateKey);
                this.publicKey = parsePublicKey(rawPublicKey);
            }
            this.jwtParser = Jwts.parser()
                    .verifyWith(publicKey)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize RS256 Cryptographic Keys", e);
        }
    }

    public String generateToken(User user, java.util.UUID tenantId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tenantId", tenantId.toString());
        claims.put("userId", user.getId().toString());
        claims.put("roles", role);
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("email", user.getEmail());
        claims.put("impersonated", false);

        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            jwtParser.parseSignedClaims(token);
            return true;
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
