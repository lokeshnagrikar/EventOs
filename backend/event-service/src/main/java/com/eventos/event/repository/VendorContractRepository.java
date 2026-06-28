package com.eventos.event.repository;

import com.eventos.event.entity.VendorContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorContractRepository extends JpaRepository<VendorContract, UUID> {
    List<VendorContract> findAllByTenantId(UUID tenantId);
    Optional<VendorContract> findByIdAndTenantId(UUID id, UUID tenantId);
    List<VendorContract> findAllByBookingIdAndTenantId(UUID bookingId, UUID tenantId);
    List<VendorContract> findAllByVendorIdAndTenantId(UUID vendorId, UUID tenantId);
}
