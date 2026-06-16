package com.eventos.auth.controller;

import com.eventos.auth.entity.Company;
import com.eventos.auth.entity.Role;
import com.eventos.auth.entity.User;
import com.eventos.auth.entity.Membership;
import com.eventos.auth.repository.MembershipRepository;
import com.eventos.auth.repository.CompanyRepository;
import com.eventos.auth.repository.RoleRepository;
import com.eventos.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/settings")
public class SettingsController {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;

    public SettingsController(CompanyRepository companyRepository,
                              UserRepository userRepository,
                              RoleRepository roleRepository,
                              MembershipRepository membershipRepository,
                              PasswordEncoder passwordEncoder) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.membershipRepository = membershipRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // --- Company & Branding Endpoints ---

    @GetMapping("/company")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getCompanySettings(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Company> companies = companyRepository.findByTenantId(tenantId);
        
        Company company;
        if (companies.isEmpty()) {
            // Auto-create a default company profile if not present
            company = Company.builder()
                    .tenantId(tenantId)
                    .name("My Event Agency")
                    .timezone("Asia/Kolkata")
                    .currency("INR")
                    .primaryColor("#9333ea")
                    .secondaryColor("#18181b")
                    .build();
            company = companyRepository.save(company);
        } else {
            company = companies.get(0);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", company);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/company")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateCompanySettings(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Company> companies = companyRepository.findByTenantId(tenantId);
        
        Company company;
        if (companies.isEmpty()) {
            company = new Company();
            company.setTenantId(tenantId);
        } else {
            company = companies.get(0);
        }

        if (request.containsKey("name")) company.setName(request.get("name"));
        if (request.containsKey("logoUrl")) company.setLogoUrl(request.get("logoUrl"));
        if (request.containsKey("email")) company.setEmail(request.get("email"));
        if (request.containsKey("phone")) company.setPhone(request.get("phone"));
        if (request.containsKey("website")) company.setWebsite(request.get("website"));
        if (request.containsKey("address")) company.setAddress(request.get("address"));
        if (request.containsKey("gstNumber")) company.setGstNumber(request.get("gstNumber"));
        if (request.containsKey("primaryColor")) company.setPrimaryColor(request.get("primaryColor"));
        if (request.containsKey("secondaryColor")) company.setSecondaryColor(request.get("secondaryColor"));
        if (request.containsKey("timezone")) company.setTimezone(request.get("timezone"));
        if (request.containsKey("currency")) company.setCurrency(request.get("currency"));

        Company saved = companyRepository.save(company);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    // --- Team Management Endpoints ---

    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> getTeamMembers(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Membership> memberships = membershipRepository.findAllByTenantId(tenantId);

        List<Map<String, Object>> members = new ArrayList<>();
        for (Membership m : memberships) {
            if (!"ACTIVE".equals(m.getStatus())) continue;
            if (m.getUser().isDeleted()) continue;
            Map<String, Object> uInfo = new HashMap<>();
            uInfo.put("id", m.getUser().getId().toString());
            uInfo.put("firstName", m.getUser().getFirstName());
            uInfo.put("lastName", m.getUser().getLastName());
            uInfo.put("email", m.getUser().getEmail());
            uInfo.put("phone", m.getUser().getPhone());
            uInfo.put("status", m.getStatus());
            uInfo.put("role", m.getRole());
            members.add(uInfo);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", members);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/team")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> addTeamMember(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);

        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email is required"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            Optional<Membership> existingOpt = membershipRepository.findByUserIdAndTenantId(user.getId(), tenantId);
            if (existingOpt.isPresent()) {
                return ResponseEntity.badRequest().body(createErrorResponse("MEMBER_EXISTS", "User is already a member of this tenant"));
            }
        } else {
            user = User.builder()
                    .firstName(request.get("firstName"))
                    .lastName(request.get("lastName"))
                    .email(email)
                    .phone(request.get("phone"))
                    .passwordHash(passwordEncoder.encode(request.getOrDefault("password", "EventOS123")))
                    .status("ACTIVE")
                    .isDeleted(false)
                    .build();
            user = userRepository.save(user);
        }

        String roleName = request.getOrDefault("role", "STAFF").toUpperCase();
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Specified role not found: " + roleName));

        // Default Company ID lookup for tenant
        List<Company> companies = companyRepository.findByTenantId(tenantId);
        UUID companyId = companies.isEmpty() ? tenantId : companies.get(0).getId();

        Membership membership = Membership.builder()
                .user(user)
                .tenantId(tenantId)
                .companyId(companyId)
                .role(role)
                .status("ACTIVE")
                .build();
        membershipRepository.save(membership);

        Map<String, Object> uInfo = new HashMap<>();
        uInfo.put("id", user.getId().toString());
        uInfo.put("firstName", user.getFirstName());
        uInfo.put("lastName", user.getLastName());
        uInfo.put("email", user.getEmail());
        uInfo.put("phone", user.getPhone());
        uInfo.put("status", membership.getStatus());
        uInfo.put("role", role);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", uInfo);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/team/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> removeTeamMember(
            @PathVariable UUID userId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Membership membership = membershipRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found or access denied"));

        membership.setStatus("INACTIVE");
        membershipRepository.save(membership);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Team member access revoked successfully");
        return ResponseEntity.ok(response);
    }

    // --- Helpers ---

    private UUID getTenantId(String header) {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        if (header != null && !header.isEmpty()) {
            return UUID.fromString(header);
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_REQUEST, "Tenant ID context is missing");
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
