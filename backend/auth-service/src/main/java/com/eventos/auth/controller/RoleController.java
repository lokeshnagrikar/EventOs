package com.eventos.auth.controller;

import com.eventos.auth.entity.Role;
import com.eventos.auth.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
        List<Role> roles = roleService.getAllRoles();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", roles);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> createRole(@RequestBody Role role) {
        Role saved = roleService.saveRole(role);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateRole(@PathVariable UUID id, @RequestBody Role roleDetails) {
        Role role = roleService.getRoleById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));
        
        role.setDescription(roleDetails.getDescription());
        if (roleDetails.getPermissionsJson() != null) {
            role.setPermissionsJson(roleDetails.getPermissionsJson());
        }
        Role saved = roleService.saveRole(role);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateRolePermissions(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String permissionsJson = request.get("permissionsJson");
        Role saved = roleService.updatePermissions(id, permissionsJson);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> deleteRole(@PathVariable UUID id) {
        roleService.deleteRole(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Role deleted successfully");
        return ResponseEntity.ok(response);
    }
}
