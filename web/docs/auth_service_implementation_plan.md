# EventOS Auth Service Implementation Plan

This implementation plan details the technical specifications, architectural designs, and development tasks required to build the production-ready **EventOS Auth Service**. It aligns with a logical logical multi-tenant isolation scheme, utilizing Spring Boot 3, Spring Security 6, PostgreSQL, Redis, RabbitMQ, and Next.js.

---

## 1. Service Architecture Diagram

The Auth Service manages identity, sessions, and permissions. It sits behind an API Gateway and utilizes Redis for temporary/volatile security states, and PostgreSQL for persistent configurations.

```mermaid
graph TD
    Client[Next.js Frontend] -->|HTTPS Port 3000| Gateway[API Gateway - Port 8080]
    Gateway -->|JWT Validate & Route| AuthServ[Auth Service - Port 8081]
    
    AuthServ --> PostgreSQL[(PostgreSQL - auth_db)]
    AuthServ --> Redis[(Redis - Port 6379)]
    AuthServ --> RabbitMQ{RabbitMQ Exchange}
    
    subgraph Downstream Propagation
        Gateway -->|Route with Headers| CRM[CRM Service - Port 8082]
        Gateway -->|Route with Headers| Event[Event Service - Port 8083]
    end
    
    subgraph Async Consumers
        RabbitMQ -->|Auth Events| NotificationServ[Notification Service]
        RabbitMQ -->|Tenant Onboarding| CRM
        RabbitMQ -->|Tenant Onboarding| Event
    end
```

---

## 2. Entity Relationship Diagram (ERD)

The relational schema implements a **Workspace Membership Model**, separating the central `User` identity from workspace-specific `Tenant` scopes, and tracking active devices (`Session`) and pending team member enrollments (`Invitation`).

```mermaid
erDiagram
    TENANT {
        uuid id PK
        string name
        string subscription_plan
        string subscription_status
        int max_users
        long max_storage
        boolean is_deleted
    }
    COMPANY {
        uuid id PK
        uuid tenant_id FK
        string name
        string logo_url
        string email
        string phone
        string timezone
        string currency
    }
    USER {
        uuid id PK
        string first_name
        string last_name
        string email UK
        string phone
        string password_hash
        string status
        timestamp last_login
        boolean is_deleted
    }
    ROLE {
        uuid id PK
        string name UK
        string description
        jsonb permissions_json
    }
    MEMBERSHIP {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        uuid company_id FK
        uuid role_id FK
        string status
    }
    REFRESH_TOKEN {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        string token_hash UK
        timestamp expiry_date
    }
    SESSION {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        uuid refresh_token_id FK
        string device_model
        string os_name
        string ip_address
        timestamp last_active_at
    }
    INVITATION {
        uuid id PK
        uuid tenant_id FK
        uuid role_id FK
        string email
        string token_hash UK
        string status
        uuid invited_by FK
        timestamp expires_at
    }

    TENANT ||--o{ COMPANY : contains
    TENANT ||--o{ MEMBERSHIP : contains
    USER ||--o{ MEMBERSHIP : has
    COMPANY ||--o{ MEMBERSHIP : references
    ROLE ||--o{ MEMBERSHIP : defines
    USER ||--o{ REFRESH_TOKEN : owns
    TENANT ||--o{ REFRESH_TOKEN : limits
    USER ||--o{ SESSION : tracks
    REFRESH_TOKEN ||--|| SESSION : binds
    TENANT ||--o{ INVITATION : issues
    ROLE ||--o{ INVITATION : targets
    USER ||--o{ INVITATION : invited
```

---

## 3. Flyway Migration Files

To update the database for session management, hashed refresh tokens, and team invitations, the database migration script is defined.

### `V5__add_auth_sessions_and_invitations.sql`

```sql
-- 1. Create sessions tracking table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    refresh_token_id UUID NOT NULL UNIQUE,
    device_model VARCHAR(100),
    os_name VARCHAR(100),
    ip_address VARCHAR(45) NOT NULL,
    last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Modify refresh_tokens table to use hashes
ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 3. Add foreign key linking session to refresh token record
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_refresh_token 
FOREIGN KEY (refresh_token_id) REFERENCES refresh_tokens(id) ON DELETE CASCADE;

-- 4. Create invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add indexes for lookup performance
CREATE INDEX idx_sessions_user_tenant ON sessions(user_id, tenant_id);
CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_invitations_email_tenant ON invitations(email, tenant_id);
```

---

## 4. JPA Entities

The Hibernate entity definitions represent the new session and invitation tracking tables.

### A. `Session.java`

```java
package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refresh_token_id", nullable = false)
    private RefreshToken refreshToken;

    @Column(name = "device_model")
    private String deviceModel;

    @Column(name = "os_name")
    private String osName;

    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    @Column(name = "last_active_at", nullable = false)
    private LocalDateTime lastActiveAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActiveAt = LocalDateTime.now();
    }
}
```

### B. `Invitation.java`

```java
package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(nullable = false)
    private String email;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, EXPIRED, REVOKED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by")
    private User invitedBy;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

---

## 5. Repository Interfaces

Database query layers are defined for the session registries and invitation checks.

### A. `SessionRepository.java`

```java
package com.eventos.auth.repository;

import com.eventos.auth.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    
    List<Session> findAllByUserId(UUID userId);
    
    List<Session> findAllByUserIdAndTenantId(UUID userId, UUID tenantId);
    
    Optional<Session> findByRefreshTokenId(UUID refreshTokenId);
    
    @Modifying
    @Query("DELETE FROM Session s WHERE s.refreshToken.id = :tokenId")
    void deleteByRefreshTokenId(@Param("tokenId") UUID tokenId);
    
    @Modifying
    @Query("DELETE FROM Session s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
```

### B. `InvitationRepository.java`

```java
package com.eventos.auth.repository;

import com.eventos.auth.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    
    Optional<Invitation> findByTokenHash(String tokenHash);
    
    List<Invitation> findAllByTenantId(UUID tenantId);
    
    Optional<Invitation> findByEmailAndTenantIdAndStatus(String email, UUID tenantId, String status);
}
```

---

## 6. DTOs (Data Transfer Objects)

DTO definitions ensure parameter validation and serialization boundaries.

### A. Request Payloads

```java
package com.eventos.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoginRequest {
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String tenantId; // Optional — defaults to primary if omitted
}

@Data
public class RegisterRequest {
    @NotBlank(message = "First name is required")
    private String firstName;
    
    private String lastName;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 10, message = "Password must be at least 10 characters long")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$", 
             message = "Password must contain uppercase, lowercase, numbers, and special characters")
    private String password;
}
```

### B. Response Payloads

```java
package com.eventos.auth.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AuthResponse {
    private boolean success;
    private String accessToken;
    private String userId;
    private String tenantId;
    private String role;
    private String firstName;
    private List<MembershipDto> memberships;
}

@Data
@Builder
public class SessionDto {
    private String id;
    private String deviceModel;
    private String osName;
    private String ipAddress;
    private String lastActiveAt;
    private boolean isCurrent;
}
```

---

## 7. Spring Security Configuration

Spring Security filters are configured to restrict access and enforce authentication rules.

```java
package com.eventos.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // cost factor 12
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/register", "/login", "/refresh", "/logout", "/forgot-password", "/reset-password").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## 8. JWT RS256 Configuration

JWT generation utilizes the asymmetric **RS256** algorithm. The public key is exposed via a JSON Web Key Set (JWKS) endpoint to allow downstream microservices to validate signatures.

```java
package com.eventos.auth.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
public class JwtKeyConfig {

    @Value("${app.jwt.private-key}")
    private String rawPrivateKey;

    @Value("${app.jwt.public-key}")
    private String rawPublicKey;

    @Bean
    public RSAPrivateKey privateKey() throws Exception {
        String key = rawPrivateKey
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    @Bean
    public RSAPublicKey publicKey() throws Exception {
        String key = rawPublicKey
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(key);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);
    }
}
```

---

## 9. Refresh Token Rotation (RTR) Implementation

Refresh Token Rotation mitigates token theft risks. Refresh tokens are hashed using SHA-256 before database storage. Re-use checks trigger an immediate revocation of all active sessions for the user.

```java
package com.eventos.auth.service;

import com.eventos.auth.entity.RefreshToken;
import com.eventos.auth.entity.User;
import com.eventos.auth.repository.RefreshTokenRepository;
import com.eventos.auth.repository.SessionRepository;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TokenRotationService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final SessionRepository sessionRepository;

    public TokenRotationService(RefreshTokenRepository refreshTokenRepository, SessionRepository sessionRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public RefreshToken rotateToken(String rawToken, User user, UUID tenantId, long expirationMs) {
        String presentedHash = DigestUtils.sha256Hex(rawToken);
        
        // 1. Check if token exists in DB
        Optional<RefreshToken> activeTokenOpt = refreshTokenRepository.findByTokenHash(presentedHash);
        
        if (activeTokenOpt.isEmpty()) {
            // Replay Attack Detected: Token hash not found. Revoke all user tokens.
            sessionRepository.deleteAllByUserId(user.getId());
            refreshTokenRepository.deleteAllByUserId(user.getId());
            throw new SecurityException("REPLAY_ATTACK_DETECTED");
        }

        RefreshToken oldToken = activeTokenOpt.get();
        if (oldToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(oldToken);
            throw new IllegalArgumentException("REFRESH_TOKEN_EXPIRED");
        }

        // 2. Generate new refresh token
        String newRawToken = UUID.randomUUID().toString();
        String newHash = DigestUtils.sha256Hex(newRawToken);

        oldToken.setTokenHash(newHash);
        oldToken.setExpiryDate(LocalDateTime.now().plusNanos(expirationMs * 1_000_000));
        RefreshToken saved = refreshTokenRepository.save(oldToken);
        
        // Return raw token value for client set-cookie response mapping
        saved.setRawTokenValueForResponse(newRawToken); 
        return saved;
    }
}
```

---

## 10. Session Management Implementation

Session management tracks active devices and enforces limits based on subscription plan tiers (Starter: 1, Growth: 3, Enterprise: Unlimited).

```java
package com.eventos.auth.service;

import com.eventos.auth.entity.Session;
import com.eventos.auth.entity.Tenant;
import com.eventos.auth.entity.User;
import com.eventos.auth.entity.RefreshToken;
import com.eventos.auth.repository.SessionRepository;
import com.eventos.auth.repository.TenantRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SessionManager {

    private final SessionRepository sessionRepository;
    private final TenantRepository tenantRepository;

    public SessionManager(SessionRepository sessionRepository, TenantRepository tenantRepository) {
        this.sessionRepository = sessionRepository;
        this.tenantRepository = tenantRepository;
    }

    public void enforceSessionLimit(User user, UUID tenantId, RefreshToken token, String ip, String os, String device) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("TENANT_NOT_FOUND"));

        List<Session> activeSessions = sessionRepository.findAllByUserIdAndTenantId(user.getId(), tenantId);
        int limit = getSessionLimit(tenant.getSubscriptionPlan());

        if (activeSessions.size() >= limit && limit > 0) {
            // Evict oldest session (FIFO)
            Session oldest = activeSessions.stream()
                    .min((s1, s2) -> s1.getLastActiveAt().compareTo(s2.getLastActiveAt()))
                    .get();
            sessionRepository.delete(oldest);
        }

        Session newSession = Session.builder()
                .user(user)
                .tenantId(tenantId)
                .refreshToken(token)
                .ipAddress(ip)
                .osName(os)
                .deviceModel(device)
                .lastActiveAt(LocalDateTime.now())
                .build();
        sessionRepository.save(newSession);
    }

    private int getSessionLimit(String plan) {
        return switch (plan.toUpperCase()) {
            case "STARTER" -> 1;
            case "GROWTH" -> 3;
            default -> 0; // 0 represents unlimited sessions
        };
    }
}
```

---

## 11. Invitation & Onboarding Workflow

The team invitation workflow generates secure 48-hour tokens. New users set their passwords, and existing users join the workspace membership.

```java
package com.eventos.auth.service;

import com.eventos.auth.entity.Invitation;
import com.eventos.auth.entity.Role;
import com.eventos.auth.repository.InvitationRepository;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class InvitationService {

    private final InvitationRepository invitationRepository;

    public InvitationService(InvitationRepository invitationRepository) {
        this.invitationRepository = invitationRepository;
    }

    public String createInvitation(UUID tenantId, String email, Role role, UUID senderId) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String tokenHash = DigestUtils.sha256Hex(rawToken);

        Invitation invitation = Invitation.builder()
                .tenantId(tenantId)
                .role(role)
                .email(email)
                .tokenHash(tokenHash)
                .status("PENDING")
                .expiresAt(LocalDateTime.now().plusHours(48)) // 48-hour lifetime
                .build();
        invitationRepository.save(invitation);

        return rawToken;
    }
}
```

---

## 12. Password Reset Workflow (Redis)

Password recovery stores secure one-time-use tokens in Redis with a 15-minute expiration time.

```java
package com.eventos.auth.service;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

@Service
public class PasswordResetService {

    private final StringRedisTemplate redisTemplate;

    public PasswordResetService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String generateResetToken(String email) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String tokenHash = DigestUtils.sha256Hex(rawToken);

        // Map SHA-256 hash to email in Redis (15-minute TTL)
        String redisKey = "reset:token:" + tokenHash;
        redisTemplate.opsForValue().set(redisKey, email, 15, TimeUnit.MINUTES);

        return rawToken;
    }

    public String validateResetToken(String rawToken) {
        String tokenHash = DigestUtils.sha256Hex(rawToken);
        String redisKey = "reset:token:" + tokenHash;
        String email = redisTemplate.opsForValue().get(redisKey);
        
        if (email == null) {
            throw new IllegalArgumentException("RESET_TOKEN_INVALID_OR_EXPIRED");
        }
        
        // Single-use token: delete from Redis immediately
        redisTemplate.delete(redisKey);
        return email;
    }
}
```

---

## 13. Audit Logging (Aspect-Oriented)

Security actions are automatically recorded in the audit trail database.

```java
package com.eventos.auth.aspect;

import com.eventos.auth.entity.AuditLog;
import com.eventos.auth.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.time.LocalDateTime;

@Aspect
@Component
public class AuditLogAspect {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogAspect(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @AfterReturning(
        pointcut = "execution(* com.eventos.auth.service.AuthService.login(..))",
        returning = "result"
    )
    public void logLoginAction(JoinPoint joinPoint, Object result) {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        
        AuditLog log = AuditLog.builder()
                .timestamp(LocalDateTime.now())
                .userIp(request.getRemoteAddr())
                .userAgent(request.getHeader("User-Agent"))
                .action("LOGIN_SUCCESS")
                .resourceType("User")
                .status("SUCCESS")
                .build();
                
        auditLogRepository.save(log);
    }
}
```

---

## 14. API Endpoints Specification

All base endpoints route through `/api/v1/auth`.

| Route | HTTP Method | Auth Role | Request Body | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| `/register` | **POST** | Public | `RegisterRequest` | `201` Created, `400` Bad Request |
| `/login` | **POST** | Public | `LoginRequest` | `200` OK, `401` Unauthorized, `423` Locked |
| `/refresh` | **POST** | Public | None (cookie attached) | `200` OK, `401` Token Expired |
| `/logout` | **POST** | Authenticated | `{ "email": "string" }` | `200` OK |
| `/forgot-password` | **POST** | Public | `{ "email": "string" }` | `200` OK, `404` User Not Found |
| `/reset-password` | **POST** | Public | `{ "token": "string", "password": "string" }` | `200` OK, `400` Expired |
| `/settings/team` | **GET** | `OWNER`, `ADMIN`| None | `200` OK, `403` Forbidden |
| `/settings/team` | **POST** | `OWNER`, `ADMIN`| `TeamInviteRequest` | `201` Created, `400` Exists |
| `/settings/team/{id}` | **DELETE** | `OWNER`, `ADMIN`| None | `200` OK, `404` Not Found |
| `/sessions` | **GET** | Authenticated | None | `200` OK, `401` Unauthorized |
| `/sessions/{id}` | **DELETE** | Authenticated | None | `200` OK, `404` Not Found |

---

## 15. Request & Response Examples

### A. Login Success
* **Request:** `POST /api/v1/auth/login`
  ```json
  {
    "email": "lokesh@myevents.com",
    "password": "SecretPassword@123"
  }
  ```
* **Response Headers:**
  ```http
  Set-Cookie: refreshToken=d023a1a9-d3e9-4e50-9f20-1a7428c0b9a1; Path=/api/v1/auth/refresh; HttpOnly; Secure; SameSite=Lax
  ```
* **Response JSON (200 OK):**
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...",
    "userId": "9a0b12c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "tenantId": "c4d51bfa-83de-43ff-8898-d14ef5e99876",
    "role": "ADMIN",
    "firstName": "Lokesh"
  }
  ```

### B. Account Locked (Brute Force Protection)
* **Response JSON (423 Locked):**
  ```json
  {
    "success": false,
    "error": {
      "code": "ACCOUNT_TEMPORARILY_LOCKED",
      "message": "Account locked due to too many failed attempts. Try again in 15 minutes."
    }
  }
  ```

---

## 16. Exception Handling Strategy

Standard JSON error envelopes are returned using a centralized `@RestControllerAdvice` controller.

```java
package com.eventos.auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<?> handleSecurityException(SecurityException ex) {
        return buildErrorResponse("UNAUTHORIZED_ACCESS", ex.getMessage(), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        return buildErrorResponse("BAD_REQUEST", ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    private ResponseEntity<?> buildErrorResponse(String code, String message, HttpStatus status) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("code", code);
        errorDetails.put("message", message);

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", errorDetails);

        return new ResponseEntity<>(response, status);
    }
}
```

---

## 17. Integration with RabbitMQ

The Auth service publishes messages to `eventos.auth.exchange` when operations mutate user membership contexts.

```java
package com.eventos.auth.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public AuthEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishTenantCreated(UUID tenantId, String companyName, String email) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventId", UUID.randomUUID().toString());
        event.put("eventType", "TENANT_CREATED");
        event.put("tenantId", tenantId.toString());
        event.put("companyName", companyName);
        event.put("ownerEmail", email);

        rabbitTemplate.convertAndSend("eventos.auth.exchange", "auth.tenant.created", event);
    }

    public void publishInvitationCreated(UUID tenantId, String email, String inviteLink) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "TEAM_INVITATION_CREATED");
        event.put("tenantId", tenantId.toString());
        event.put("targetEmail", email);
        event.put("inviteLink", inviteLink);

        rabbitTemplate.convertAndSend("eventos.auth.exchange", "auth.invitation.created", event);
    }
}
```

---

## 18. Redis Key Structure

The following key layouts manage security limits and recovery states:

| Key Category | Redis Key Format | Data Type | Value Schema | TTL | Purpose |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **Login Lockout** | `lockout:count:{email}` | String | Integer (Failed attempts) | 15 Mins | Tracks lockout thresholds. |
| **Lockout Lock** | `lockout:status:{email}` | String | `"LOCKED"` | 15 Mins | Rejects attempts immediately. |
| **Password Recovery**| `reset:token:{token_hash}` | String | User Email String | 15 Mins | Maps reset token to email. |
| **API Rate Limits** | `rate:ip:{ip_address}:{minute}` | String | Integer (Request count) | 1 Min | sliding-window Nginx/Gateway rules. |

---

## 19. Unit & Integration Test Plan

### A. Unit Tests
* **`TokenRotationServiceTest`:** Mock the `RefreshTokenRepository` and verify that presenting a valid token returns a new rotated token, while presenting a missing/rotated token triggers the `REPLAY_ATTACK_DETECTED` security block.
* **`SessionManagerTest`:** Mock repository limits and test the FIFO eviction rules for Starter plan and Growth plan boundaries.

### B. Integration Tests
* **`AuthControllerIntegrationTest`:** Set up standard test parameters using test containers (PostgreSQL and Redis) and mock MVC calls:
  * Validate that `POST /login` sets the HTTP-Only cookie.
  * Verify that `POST /refresh` succeeds when the cookie is attached, and returns a `401 Unauthorized` after session revocation or token expiration.
  * Verify lockout state transitions when five consecutive invalid password payloads target `POST /login`.

---

## 20. Implementation Tasks Registry

Tasks are structured to run concurrently across development streams:

### A. Database Team
- [ ] **DB-01:** Write Flyway migration scripts `V5__add_auth_sessions_and_invitations.sql` implementing tables and indexes.
- [ ] **DB-02:** Build the performance indexing configurations for search terms (hashes, user emails, tenants).

### B. Backend Team
- [ ] **BE-01:** Implement `Session` and `Invitation` entities along with their matching JPA repositories.
- [ ] **BE-02:** Develop `TokenRotationService` containing the SHA-256 validation checks.
- [ ] **BE-03:** Set up the Redis integration for password reset tokens and lockout state counters.
- [ ] **BE-04:** Code the Session manager rules enforcing maximum session limits per tenant plan.
- [ ] **BE-05:** Configure the Spring Security and JWKS filters using the RS256 public key.
- [ ] **BE-06:** Build the RabbitMQ event publisher classes.

### C. Infrastructure Team
- [ ] **INF-01:** Configure Nginx and the API Gateway configuration to enforce sliding-window IP rate limits.
- [ ] **INF-02:** Configure container keys for the private and public keys matching target dev and production profiles.

### D. Frontend Team
- [ ] **FE-01:** Implement the Next.js auth state managers, using cookies and Axios silent-refresh interceptors.
- [ ] **FE-02:** Build the workspace Owner welcome configuration page.
- [ ] **FE-03:** Add the security dashboard containing the list of active user sessions with revocation controls.

### E. QA Team
- [ ] **QA-01:** Set up execution scripts to run concurrent logins to verify that session counts are restricted to plan limits.
- [ ] **QA-02:** Run automated dictionary tests against the login API to verify that account lockouts trigger after five failed attempts.
- [ ] **QA-03:** Verify that a stolen and reused refresh token immediately invalidates all active sessions for the user.
