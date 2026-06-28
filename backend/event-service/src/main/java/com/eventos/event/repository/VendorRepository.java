package com.eventos.event.repository;

import com.eventos.event.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, UUID> {
    List<Vendor> findAllByTenantId(UUID tenantId);
    Optional<Vendor> findByIdAndTenantId(UUID id, UUID tenantId);
}
