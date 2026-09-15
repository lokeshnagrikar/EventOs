package com.eventos.auth.controller;

import com.eventos.auth.config.UserPrincipal;
import com.eventos.auth.dto.CreateRoleDto;
import com.eventos.auth.dto.UpdateRoleDto;
import com.eventos.auth.entity.Role;
import com.eventos.auth.service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/settings/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getAllRoles() {
        UUID tenantId = getTenantId();
        List<Role> roles = roleService.getRolesVisibleToTenant(tenantId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", roles);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> createRole(@Valid @RequestBody CreateRoleDto dto) {
        UUID tenantId = getTenantId();
        try {
            Role saved = roleService.createCustomRole(tenantId, dto);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", saved);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("FORBIDDEN", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateRole(@PathVariable UUID id, @Valid @RequestBody UpdateRoleDto dto) {
        UUID tenantId = getTenantId();
        try {
            Role saved = roleService.updateCustomRole(id, tenantId, dto);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", saved);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("FORBIDDEN", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", "Role not found"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        }
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateRolePermissions(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        UUID tenantId = getTenantId();
        try {
            UpdateRoleDto dto = new UpdateRoleDto();
            if (request.containsKey("permissions") && request.get("permissions") instanceof List) {
                dto.setPermissions((List<String>) request.get("permissions"));
            }
            if (request.containsKey("permissionsJson")) {
                dto.setPermissionsJson(Objects.toString(request.get("permissionsJson"), null));
            }

            Role saved = roleService.updateCustomRole(id, tenantId, dto);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", saved);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("FORBIDDEN", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", "Role not found"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> deleteRole(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        try {
            roleService.deleteCustomRole(id, tenantId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Role deleted successfully");
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("FORBIDDEN", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", "Role not found"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(createErrorResponse("CONFLICT", e.getMessage()));
        }
    }

    private UUID getTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            UUID tenantId = ((UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing or unauthenticated");
    }

    private Map<String, Object> createErrorResponse(String code, String message) {
        Map<String, Object> err = new HashMap<>();
        err.put("code", code);
        err.put("message", message);

        Map<String, Object> res = new HashMap<>();
        res.put("success", false);
        res.put("error", err);
        return res;
    }
}
