package com.eventos.event.repository;

import com.eventos.event.entity.Payment;
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
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findAllByTenantIdOrderByPaymentDateDesc(UUID tenantId);
    Page<Payment> findAllByTenantIdOrderByPaymentDateDesc(UUID tenantId, Pageable pageable);
    List<Payment> findAllByBookingIdAndTenantIdOrderByPaymentDateDesc(UUID bookingId, UUID tenantId);
    Optional<Payment> findByIdAndTenantId(UUID id, UUID tenantId);
    List<Payment> findAllByBookingIdAndStatus(UUID bookingId, String status);
    List<Payment> findAllByInvoiceIdAndStatus(UUID invoiceId, String status);

    @Query("SELECT p.status, COUNT(p) FROM Payment p WHERE p.tenantId = :tenantId GROUP BY p.status")
    List<Object[]> countByStatusAndTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT p.paymentMethod, COUNT(p), COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenantId = :tenantId GROUP BY p.paymentMethod")
    List<Object[]> countAndSumByPaymentMethodAndTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.tenantId = :tenantId")
    java.math.BigDecimal getTotalVolumeByTenantId(@Param("tenantId") UUID tenantId);

    @Query(value = "SELECT TO_CHAR(p.payment_date, 'Mon YYYY') as month_year, COALESCE(SUM(p.amount), 0) " +
           "FROM payments p WHERE p.tenant_id = :tenantId AND p.status = 'SUCCESSFUL' " +
           "GROUP BY TO_CHAR(p.payment_date, 'Mon YYYY')", nativeQuery = true)
    List<Object[]> getMonthlyRevenueByTenantId(@Param("tenantId") UUID tenantId);
}
