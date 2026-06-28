package com.eventos.event.repository;

import com.eventos.event.entity.VendorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorAssignmentRepository extends JpaRepository<VendorAssignment, UUID> {
    List<VendorAssignment> findAllByTenantId(UUID tenantId);
    Optional<VendorAssignment> findByIdAndTenantId(UUID id, UUID tenantId);
    List<VendorAssignment> findAllByBookingIdAndTenantId(UUID bookingId, UUID tenantId);
}
