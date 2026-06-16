package com.eventos.event.repository;

import com.eventos.event.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    Page<Invoice> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);
    List<Invoice> findAllByBookingIdAndTenantIdOrderByCreatedAtDesc(UUID bookingId, UUID tenantId);
    Optional<Invoice> findByIdAndTenantId(UUID id, UUID tenantId);
    Optional<Invoice> findByInvoiceNumberAndTenantId(String invoiceNumber, UUID tenantId);
    long countByTenantId(UUID tenantId);
    List<Invoice> findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(String clientEmail, UUID tenantId);

    @Query("SELECT i.status, COUNT(i), COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.tenantId = :tenantId GROUP BY i.status")
    List<Object[]> getInvoiceSumsAndCountsByStatus(@Param("tenantId") UUID tenantId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0), COALESCE(SUM(i.subtotal), 0), COALESCE(SUM(i.tax), 0), COALESCE(SUM(i.discount), 0) FROM Invoice i WHERE i.tenantId = :tenantId")
    List<Object[]> getInvoiceSummaryAndTenantId(@Param("tenantId") UUID tenantId);
}
