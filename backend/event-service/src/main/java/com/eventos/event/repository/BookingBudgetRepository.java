package com.eventos.event.repository;

import com.eventos.event.entity.BookingBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface BookingBudgetRepository extends JpaRepository<BookingBudget, UUID> {
    Optional<BookingBudget> findByBookingIdAndTenantId(UUID bookingId, UUID tenantId);
}
