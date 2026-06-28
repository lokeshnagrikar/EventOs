package com.eventos.event.repository;

import com.eventos.event.entity.BudgetEstimate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetEstimateRepository extends JpaRepository<BudgetEstimate, UUID> {
    List<BudgetEstimate> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<BudgetEstimate> findAllByTenantIdAndClientEmailIgnoreCaseOrderByCreatedAtDesc(UUID tenantId, String clientEmail);
    Optional<BudgetEstimate> findByIdAndTenantId(UUID id, UUID tenantId);

}
