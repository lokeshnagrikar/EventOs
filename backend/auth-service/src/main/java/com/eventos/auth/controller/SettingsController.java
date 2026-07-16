package com.eventos.auth.controller;

import com.eventos.auth.entity.Company;
import com.eventos.auth.entity.Membership;
import com.eventos.auth.entity.User;
import com.eventos.auth.repository.MembershipRepository;
import com.eventos.auth.repository.CompanyRepository;
import com.eventos.auth.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final AuthService authService;

    public SettingsController(CompanyRepository companyRepository,
            MembershipRepository membershipRepository,
            UserRepository userRepository,
            AuthService authService) {
        this.companyRepository = companyRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
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

    // --- User Profile Endpoints ---

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        UUID userId = getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId().toString());
        data.put("firstName", user.getFirstName());
        data.put("lastName", user.getLastName());
        data.put("email", user.getEmail());
        data.put("phone", user.getPhone());
        data.put("profileImage", user.getProfileImage());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody Map<String, String> request) {
        UUID userId = getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        if (request.containsKey("firstName"))
            user.setFirstName(request.get("firstName"));
        if (request.containsKey("lastName"))
            user.setLastName(request.get("lastName"));
        if (request.containsKey("phone"))
            user.setPhone(request.get("phone"));
        if (request.containsKey("profileImage"))
            user.setProfileImage(request.get("profileImage"));

        User saved = userRepository.save(user);

        Map<String, Object> data = new HashMap<>();
        data.put("id", saved.getId().toString());
        data.put("firstName", saved.getFirstName());
        data.put("lastName", saved.getLastName());
        data.put("email", saved.getEmail());
        data.put("phone", saved.getPhone());
        data.put("profileImage", saved.getProfileImage());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    // --- Helpers ---

    private UUID getUserId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            return ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getUserId();
        }
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "User context is missing");
    }

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
