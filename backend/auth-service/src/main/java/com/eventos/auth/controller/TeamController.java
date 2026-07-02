package com.eventos.auth.controller;

import com.eventos.auth.entity.Membership;
import com.eventos.auth.entity.User;
import com.eventos.auth.repository.MembershipRepository;
import com.eventos.auth.repository.UserRepository;
import com.eventos.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings/team")
public class TeamController {

    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public TeamController(MembershipRepository membershipRepository,
                          UserRepository userRepository,
                          AuthService authService) {
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getTeamMembers(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Membership> memberships = membershipRepository.findAllByTenantId(tenantId);

        List<Map<String, Object>> members = new ArrayList<>();
        for (Membership m : memberships) {
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
            uInfo.put("profileImage", m.getUser().getProfileImage());
            uInfo.put("lastLogin", m.getUser().getLastLogin());
            members.add(uInfo);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", members);
        return ResponseEntity.ok(response);
    }

    @PostMapping
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

        UUID senderId = getCurrentUserId();

        try {
            Map<String, Object> result = authService.inviteTeamMember(tenantId, email, firstName, lastName, roleName,
                    phone, senderId);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVITATION_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/bulk-invite")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> bulkInvite(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<String> emails = (List<String>) request.get("emails");
        String roleName = (String) request.getOrDefault("role", "STAFF");
        
        if (emails == null || emails.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Emails are required"));
        }

        UUID senderId = getCurrentUserId();
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (String email : emails) {
            Map<String, Object> emailRes = new HashMap<>();
            emailRes.put("email", email);
            try {
                authService.inviteTeamMember(tenantId, email, email.split("@")[0], "", roleName, null, senderId);
                emailRes.put("success", true);
            } catch (Exception e) {
                emailRes.put("success", false);
                emailRes.put("error", e.getMessage());
            }
            results.add(emailRes);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", results);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
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

    @PutMapping("/{userId}/suspend")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> suspendTeamMember(
            @PathVariable UUID userId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Membership membership = membershipRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found or access denied"));

        membership.setStatus("SUSPENDED");
        membershipRepository.save(membership);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Team member suspended successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}/restore")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> restoreTeamMember(
            @PathVariable UUID userId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Membership membership = membershipRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found or access denied"));

        membership.setStatus("ACTIVE");
        membershipRepository.save(membership);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Team member restored successfully");
        return ResponseEntity.ok(response);
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

    private UUID getCurrentUserId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            return ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getUserId();
        }
        return null;
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
