package com.eventos.auth.service;

import com.eventos.auth.config.PlatformRole;
import com.eventos.auth.dto.CreateRoleDto;
import com.eventos.auth.dto.UpdateRoleDto;
import com.eventos.auth.entity.Role;
import com.eventos.auth.repository.MembershipRepository;
import com.eventos.auth.repository.RoleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final MembershipRepository membershipRepository;
    private final ObjectMapper objectMapper;

    private static final Set<String> BUILTIN_SYSTEM_ROLE_NAMES = Set.of(
            "SUPER_ADMIN", "OWNER", "ADMIN", "MANAGER", "STAFF", "CLIENT",
            "OPERATIONS_LEAD", "SUPPORT_LEAD", "FINANCE_OFFICER", "DEVOPS_ENGINEER", "COMPLIANCE_AUDITOR"
    );

    public RoleService(RoleRepository roleRepository,
                       MembershipRepository membershipRepository,
                       ObjectMapper objectMapper) {
        this.roleRepository = roleRepository;
        this.membershipRepository = membershipRepository;
        this.objectMapper = objectMapper;
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public List<Role> getRolesVisibleToTenant(UUID tenantId) {
        if (tenantId == null) {
            return roleRepository.findAll();
        }
        return roleRepository.findAllVisibleToTenant(tenantId);
    }

    public Optional<Role> getRoleById(UUID id) {
        return roleRepository.findById(id);
    }

    public Optional<Role> getRoleByIdForTenant(UUID id, UUID tenantId) {
        Optional<Role> roleOpt = roleRepository.findById(id);
        if (roleOpt.isEmpty()) {
            return Optional.empty();
        }
        Role role = roleOpt.get();
        if (Boolean.TRUE.equals(role.getIsSystemRole()) || role.getTenantId() == null) {
            return Optional.of(role);
        }
        if (tenantId != null && tenantId.equals(role.getTenantId())) {
            return Optional.of(role);
        }
        return Optional.empty();
    }

    public Optional<Role> getRoleByName(String name) {
        return roleRepository.findByName(name.toUpperCase());
    }

    public Optional<Role> getRoleByNameForTenant(String name, UUID tenantId) {
        if (name == null || name.trim().isEmpty()) {
            return Optional.empty();
        }
        String cleanName = name.trim().toUpperCase();
        if (tenantId != null) {
            Optional<Role> custom = roleRepository.findByNameIgnoreCaseAndTenantId(cleanName, tenantId);
            if (custom.isPresent()) {
                return custom;
            }
        }
        return roleRepository.findByNameIgnoreCaseAndIsSystemRoleTrue(cleanName)
                .or(() -> roleRepository.findByName(cleanName));
    }

    @Transactional
    public Role createCustomRole(UUID tenantId, CreateRoleDto dto) {
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant context is required to create a custom role");
        }

        String rawName = dto.getName().trim().toUpperCase();
        if (isReservedSystemRoleName(rawName)) {
            throw new IllegalArgumentException("Role name '" + rawName + "' is reserved for system/platform roles and cannot be created");
        }

        if (roleRepository.existsByNameIgnoreCaseAndTenantId(rawName, tenantId)) {
            throw new IllegalArgumentException("A role with name '" + rawName + "' already exists for this tenant");
        }

        String permissionsJson = sanitizeAndSerializePermissions(dto.getPermissions(), dto.getPermissionsJson());

        Role role = Role.builder()
                .name(rawName)
                .tenantId(tenantId)
                .isSystemRole(false)
                .description(dto.getDescription())
                .permissionsJson(permissionsJson)
                .build();

        return roleRepository.save(role);
    }

    @Transactional
    public Role updateCustomRole(UUID id, UUID tenantId, UpdateRoleDto dto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role not found with ID: " + id));

        // System role immutability guard
        if (Boolean.TRUE.equals(role.getIsSystemRole()) || role.getTenantId() == null) {
            throw new SecurityException("System roles are immutable and cannot be modified by tenant administrators");
        }

        // Strict tenant isolation guard (never mutate cross-tenant roles)
        if (tenantId == null || !tenantId.equals(role.getTenantId())) {
            throw new NoSuchElementException("Role not found with ID: " + id);
        }

        if (dto.getDescription() != null) {
            role.setDescription(dto.getDescription());
        }

        if (dto.getPermissions() != null || dto.getPermissionsJson() != null) {
            String sanitizedJson = sanitizeAndSerializePermissions(dto.getPermissions(), dto.getPermissionsJson());
            role.setPermissionsJson(sanitizedJson);
        }

        return roleRepository.save(role);
    }

    @Transactional
    public void deleteCustomRole(UUID id, UUID tenantId) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role not found with ID: " + id));

        // System role deletion guard
        if (Boolean.TRUE.equals(role.getIsSystemRole()) || role.getTenantId() == null) {
            throw new SecurityException("System roles are immutable and cannot be deleted");
        }

        // Strict tenant isolation guard
        if (tenantId == null || !tenantId.equals(role.getTenantId())) {
            throw new NoSuchElementException("Role not found with ID: " + id);
        }

        // Check if any active memberships use this role
        long activeMemberships = membershipRepository.findAllByTenantId(tenantId).stream()
                .filter(m -> m.getRole() != null && id.equals(m.getRole().getId()))
                .count();

        if (activeMemberships > 0) {
            throw new IllegalStateException("Cannot delete role: " + activeMemberships + " team member(s) are currently assigned to it");
        }

        roleRepository.delete(role);
    }

    @Transactional
    public Role updatePermissions(UUID roleId, String permissionsJson) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));
        if (Boolean.TRUE.equals(role.getIsSystemRole()) || role.getTenantId() == null) {
            throw new SecurityException("System roles are immutable and cannot be modified");
        }
        role.setPermissionsJson(permissionsJson);
        return roleRepository.save(role);
    }

    @Transactional
    public Role saveRole(Role role) {
        if (role.getName() != null) {
            role.setName(role.getName().toUpperCase());
        }
        return roleRepository.save(role);
    }

    @Transactional
    public void deleteRole(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role not found"));
        if (Boolean.TRUE.equals(role.getIsSystemRole()) || role.getTenantId() == null) {
            throw new SecurityException("System roles are immutable and cannot be deleted");
        }
        roleRepository.deleteById(id);
    }

    public boolean isReservedSystemRoleName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return false;
        }
        String clean = name.trim().toUpperCase();
        return BUILTIN_SYSTEM_ROLE_NAMES.contains(clean) || PlatformRole.isPlatformRole(clean);
    }

    private String sanitizeAndSerializePermissions(List<String> permissionsList, String permissionsJson) {
        List<String> perms = new ArrayList<>();
        if (permissionsList != null && !permissionsList.isEmpty()) {
            perms.addAll(permissionsList);
        } else if (permissionsJson != null && !permissionsJson.trim().isEmpty()) {
            try {
                perms = objectMapper.readValue(permissionsJson, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid permissionsJson format: must be a valid JSON array of strings");
            }
        }

        // Validate that no platform-level authority is requested
        for (String p : perms) {
            if (p == null) continue;
            String clean = p.trim().toLowerCase();
            if (clean.startsWith("admin:") || clean.startsWith("tenant:impersonate") ||
                clean.startsWith("tenant:write") || clean.startsWith("billing:write") ||
                clean.startsWith("blacklist:") || clean.startsWith("system:") ||
                clean.startsWith("audit:") || clean.startsWith("telemetry:")) {
                throw new SecurityException("Custom roles cannot be granted platform/superadmin authority: " + p);
            }
        }

        try {
            return objectMapper.writeValueAsString(perms);
        } catch (Exception e) {
            return "[]";
        }
    }
}
