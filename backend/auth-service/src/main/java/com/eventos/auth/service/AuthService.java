package com.eventos.auth.service;

import com.eventos.auth.entity.Company;
import com.eventos.auth.entity.Membership;
import com.eventos.auth.entity.RefreshToken;
import com.eventos.auth.entity.Role;
import com.eventos.auth.entity.Tenant;
import com.eventos.auth.entity.User;
import com.eventos.auth.repository.CompanyRepository;
import com.eventos.auth.repository.MembershipRepository;
import com.eventos.auth.repository.RefreshTokenRepository;
import com.eventos.auth.repository.RoleRepository;
import com.eventos.auth.repository.TenantRepository;
import com.eventos.auth.repository.UserRepository;
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
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final CompanyRepository companyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StringRedisTemplate stringRedisTemplate;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       TenantRepository tenantRepository, CompanyRepository companyRepository,
                       RefreshTokenRepository refreshTokenRepository, MembershipRepository membershipRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService,
                       StringRedisTemplate stringRedisTemplate) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.tenantRepository = tenantRepository;
        this.companyRepository = companyRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.membershipRepository = membershipRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Transactional
    public Map<String, Object> register(Map<String, String> request) {
        String email = request.get("email");
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email address is already in use");
        }

        // 1. Create Tenant
        String tenantName = request.getOrDefault("companyName", "New Tenant");
        Tenant tenant = Tenant.builder()
                .name(tenantName)
                .build();
        tenant = tenantRepository.save(tenant);

        // 2. Create Company profile
        Company company = Company.builder()
                .tenantId(tenant.getId())
                .name(tenantName)
                .email(email)
                .phone(request.get("phone"))
                .build();
        company = companyRepository.save(company);

        // 3. Load ADMIN role
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("Default ADMIN role not found"));

        // 4. Create Admin User
        User user = User.builder()
                .firstName(request.get("firstName"))
                .lastName(request.get("lastName"))
                .email(email)
                .phone(request.get("phone"))
                .passwordHash(passwordEncoder.encode(request.get("password")))
                .build();
        user = userRepository.save(user);

        // 5. Create initial Membership linking User to Tenant, Company, and Role
        Membership membership = Membership.builder()
                .user(user)
                .tenantId(tenant.getId())
                .companyId(company.getId())
                .role(adminRole)
                .status("ACTIVE")
                .build();
        membershipRepository.save(membership);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Tenant and Admin User registered successfully");
        return result;
    }

    @Transactional
    public Map<String, Object> login(String email, String password, UUID selectTenantId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
        if (memberships.isEmpty()) {
            throw new IllegalArgumentException("User does not belong to any tenant workspace");
        }

        Membership selectedMembership = null;
        if (selectTenantId != null) {
            selectedMembership = memberships.stream()
                    .filter(m -> m.getTenantId().equals(selectTenantId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("User is not a member of the requested tenant"));
        } else {
            selectedMembership = memberships.stream()
                    .filter(m -> "ACTIVE".equals(m.getStatus()))
                    .findFirst()
                    .orElse(memberships.get(0));
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Access Token
        String accessToken = jwtService.generateToken(user, selectedMembership.getTenantId(), selectedMembership.getRole().getName());

        // Refresh Token
        String tokenStr = UUID.randomUUID().toString();
        refreshTokenRepository.deleteByUser(user); // Clean old sessions
        
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenStr)
                .tenantId(selectedMembership.getTenantId())
                .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                .build();
        refreshTokenRepository.save(refreshToken);

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
        response.put("refreshToken", tokenStr);
        response.put("userId", user.getId().toString());
        response.put("tenantId", selectedMembership.getTenantId().toString());
        response.put("role", selectedMembership.getRole().getName());
        response.put("firstName", user.getFirstName());
        response.put("memberships", membershipList);

        return response;
    }

    @Transactional
    public Map<String, Object> refresh(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
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

        String accessToken = jwtService.generateToken(user, tenantId, membership.getRole().getName());

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken.getToken()); // Keep same token
        return response;
    }

    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(refreshTokenRepository::deleteByUser);
    }

    private final SecureRandom secureRandom = new SecureRandom();

    public Map<String, Object> forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email address not found"));

        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String resetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        String redisKey = "reset:token:" + resetToken;
        stringRedisTemplate.opsForValue().set(redisKey, user.getEmail(), 15, TimeUnit.MINUTES);

        // Print to console for verification/logs (do not expose in payload)
        System.out.println("=================================================");
        System.out.println("PASSWORD RESET REQUESTED FOR: " + email);
        System.out.println("RESET TOKEN: " + resetToken);
        System.out.println("=================================================");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Reset token generated successfully. Check system logs.");
        return response;
    }

    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword) {
        String redisKey = "reset:token:" + token;
        String email = stringRedisTemplate.opsForValue().get(redisKey);
        if (email == null) {
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User associated with token not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        stringRedisTemplate.delete(redisKey); // Single-use consumption

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password has been reset successfully");
        return response;
    }
}
