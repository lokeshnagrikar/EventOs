package com.eventos.auth.service;

import com.eventos.auth.entity.Role;
import com.eventos.auth.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Optional<Role> getRoleById(UUID id) {
        return roleRepository.findById(id);
    }

    public Optional<Role> getRoleByName(String name) {
        return roleRepository.findByName(name.toUpperCase());
    }

    @Transactional
    public Role saveRole(Role role) {
        role.setName(role.getName().toUpperCase());
        return roleRepository.save(role);
    }

    @Transactional
    public Role updatePermissions(UUID roleId, String permissionsJson) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));
        role.setPermissionsJson(permissionsJson);
        return roleRepository.save(role);
    }

    @Transactional
    public void deleteRole(UUID id) {
        roleRepository.deleteById(id);
    }
}
