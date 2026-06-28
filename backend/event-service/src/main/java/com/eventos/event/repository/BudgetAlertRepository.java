package com.eventos.event.repository;

import com.eventos.event.entity.AlertType;
import com.eventos.event.entity.BudgetAlert;
import com.eventos.event.entity.BudgetCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetAlertRepository extends JpaRepository<BudgetAlert, UUID> {
    List<BudgetAlert> findAllByBookingIdAndTenantId(UUID bookingId, UUID tenantId);
    List<BudgetAlert> findAllByBookingIdAndTenantIdAndResolvedFalse(UUID bookingId, UUID tenantId);
    Optional<BudgetAlert> findByBookingIdAndCategoryAndAlertTypeAndTenantId(UUID bookingId, BudgetCategory category, AlertType alertType, UUID tenantId);
    Optional<BudgetAlert> findByBookingIdAndCategoryIsNullAndAlertTypeAndTenantId(UUID bookingId, AlertType alertType, UUID tenantId);
    Optional<BudgetAlert> findByIdAndTenantId(UUID id, UUID tenantId);
}
