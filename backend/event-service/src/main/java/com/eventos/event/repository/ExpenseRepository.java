package com.eventos.event.repository;

import com.eventos.event.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findAllByBookingIdAndTenantIdOrderByExpenseDateDesc(UUID bookingId, UUID tenantId);
    Optional<Expense> findByIdAndTenantId(UUID id, UUID tenantId);
}
