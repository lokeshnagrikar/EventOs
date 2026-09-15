package com.eventos.auth.repository;

import com.eventos.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(String name);

    Optional<Role> findByNameIgnoreCaseAndTenantId(String name, UUID tenantId);

    Optional<Role> findByNameIgnoreCaseAndIsSystemRoleTrue(String name);

    Optional<Role> findByIdAndTenantId(UUID id, UUID tenantId);

    List<Role> findAllByTenantId(UUID tenantId);

    @Query("SELECT r FROM Role r WHERE r.tenantId = :tenantId OR r.isSystemRole = true ORDER BY r.isSystemRole DESC, r.name ASC")
    List<Role> findAllVisibleToTenant(@Param("tenantId") UUID tenantId);

    boolean existsByNameIgnoreCaseAndTenantId(String name, UUID tenantId);

    boolean existsByNameIgnoreCaseAndIsSystemRoleTrue(String name);
}
