package com.eventos.auth.controller;

import com.eventos.auth.entity.Company;
import com.eventos.auth.entity.Membership;
import com.eventos.auth.repository.MembershipRepository;
import com.eventos.auth.repository.CompanyRepository;
import com.eventos.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings")
@SuppressWarnings("null")
public class SettingsController {

    private final CompanyRepository companyRepository;
    private final MembershipRepository membershipRepository;
    private final AuthService authService;

    public SettingsController(CompanyRepository companyRepository,
            MembershipRepository membershipRepository,
            AuthService authService) {
        this.companyRepository = companyRepository;
        this.membershipRepository = membershipRepository;
        this.authService = authService;
    }

    // --- Company & Branding Endpoints ---

    @GetMapping("/company")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
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

        if (request.containsKey("name"))
            company.setName(request.get("name"));
        if (request.containsKey("logoUrl"))
            company.setLogoUrl(request.get("logoUrl"));
        if (request.containsKey("email"))
            company.setEmail(request.get("email"));
        if (request.containsKey("phone"))
            company.setPhone(request.get("phone"));
        if (request.containsKey("website"))
            company.setWebsite(request.get("website"));
        if (request.containsKey("address"))
            company.setAddress(request.get("address"));
        if (request.containsKey("gstNumber"))
            company.setGstNumber(request.get("gstNumber"));
        if (request.containsKey("primaryColor"))
            company.setPrimaryColor(request.get("primaryColor"));
        if (request.containsKey("secondaryColor"))
            company.setSecondaryColor(request.get("secondaryColor"));
        if (request.containsKey("timezone"))
            company.setTimezone(request.get("timezone"));
        if (request.containsKey("currency"))
            company.setCurrency(request.get("currency"));

        Company saved = companyRepository.save(company);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    // --- Team Management Endpoints ---

    @GetMapping("/team")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getTeamMembers(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Membership> memberships = membershipRepository.findAllByTenantId(tenantId);

        List<Map<String, Object>> members = new ArrayList<>();
        for (Membership m : memberships) {
            if (!"ACTIVE".equals(m.getStatus()))
                continue;
            if (m.getUser().isDeleted())
                continue;
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> addTeamMember(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);

        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email is required"));
        }

        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String roleName = request.getOrDefault("role", "STAFF");
        String phone = request.get("phone");

        // Resolve senderId from current principal if available
        UUID senderId = null;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
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

    @DeleteMapping("/team/{userId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
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
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
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
