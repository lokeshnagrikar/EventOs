package com.eventos.event.repository;

import com.eventos.event.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    Optional<Booking> findByIdAndTenantId(UUID id, UUID tenantId);
    Optional<Booking> findByQuoteIdAndTenantId(UUID quoteId, UUID tenantId);
    long countByTenantId(UUID tenantId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(b.totalAmount), 0), COALESCE(SUM(b.paidAmount), 0) FROM Booking b WHERE b.tenantId = :tenantId")
    List<Object[]> getBookingRevenueSummary(@org.springframework.data.repository.query.Param("tenantId") UUID tenantId);

    // Used for cascade cancellation when an event is cancelled
    List<Booking> findAllByEventIdAndTenantId(UUID eventId, UUID tenantId);

    List<Booking> findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(String clientEmail, UUID tenantId);
    org.springframework.data.domain.Page<Booking> findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(String clientEmail, UUID tenantId, org.springframework.data.domain.Pageable pageable);
}
