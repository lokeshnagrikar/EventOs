package com.eventos.event.repository;

import com.eventos.event.entity.BudgetCategory;
import com.eventos.event.entity.BudgetCategoryAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetCategoryAllocationRepository extends JpaRepository<BudgetCategoryAllocation, UUID> {
    List<BudgetCategoryAllocation> findAllByBookingIdAndTenantId(UUID bookingId, UUID tenantId);
    Optional<BudgetCategoryAllocation> findByBookingIdAndCategoryAndTenantId(UUID bookingId, BudgetCategory category, UUID tenantId);
}
