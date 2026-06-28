package com.eventos.crm.repository;

import com.eventos.crm.entity.Quote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, UUID> {
    List<Quote> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    Page<Quote> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);
    Optional<Quote> findByIdAndTenantId(UUID id, UUID tenantId);
    List<Quote> findAllByLeadIdAndTenantId(UUID leadId, UUID tenantId);
    long countByTenantId(UUID tenantId);

    @Query("SELECT q FROM Quote q WHERE q.tenantId = :tenantId AND EXISTS " +
           "(SELECT l FROM Lead l WHERE l.id = q.leadId AND l.assignedUserId = :userId) " +
           "ORDER BY q.createdAt DESC")
    List<Quote> findAllByTenantIdAndAssignedUserIdOrderByCreatedAtDesc(
            @Param("tenantId") UUID tenantId, @Param("userId") UUID userId);

    @Query("SELECT q FROM Quote q WHERE q.tenantId = :tenantId AND EXISTS " +
           "(SELECT l FROM Lead l WHERE l.id = q.leadId AND l.assignedUserId = :userId) " +
           "ORDER BY q.createdAt DESC")
    Page<Quote> findAllByTenantIdAndAssignedUserIdOrderByCreatedAtDesc(
            @Param("tenantId") UUID tenantId, @Param("userId") UUID userId, Pageable pageable);
}
