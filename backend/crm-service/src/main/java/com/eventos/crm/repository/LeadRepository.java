package com.eventos.crm.repository;

import com.eventos.crm.entity.Lead;
import com.eventos.crm.entity.LeadStatus;
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
public interface LeadRepository extends JpaRepository<Lead, UUID>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Lead> {
    List<Lead> findByTenantIdAndIsDeletedFalse(UUID tenantId);
    Page<Lead> findByTenantIdAndIsDeletedFalse(UUID tenantId, Pageable pageable);
    List<Lead> findByTenantIdAndStatusAndIsDeletedFalse(UUID tenantId, LeadStatus status);
    Optional<Lead> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
    List<Lead> findByEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(String email, UUID tenantId);

    List<Lead> findTop3ByTenantIdAndIsDeletedFalseOrderByUpdatedAtDesc(UUID tenantId);
    long countByTenantIdAndIsDeletedFalse(UUID tenantId);
    long countByTenantIdAndStatusInAndIsDeletedFalse(UUID tenantId, List<LeadStatus> statuses);

    @Query("SELECT l.status, COUNT(l) FROM Lead l WHERE l.tenantId = :tenantId AND l.isDeleted = false GROUP BY l.status")
    List<Object[]> countByStatusAndTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT l.leadSource, COUNT(l) FROM Lead l WHERE l.tenantId = :tenantId AND l.isDeleted = false GROUP BY l.leadSource")
    List<Object[]> countBySourceAndTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT COALESCE(SUM(l.budget), 0), COALESCE(AVG(l.budget), 0), COALESCE(AVG(CASE WHEN l.status = com.eventos.crm.entity.LeadStatus.BOOKED THEN l.budget ELSE null END), 0) FROM Lead l WHERE l.tenantId = :tenantId AND l.isDeleted = false")
    List<Object[]> getBudgetSummaryAndTenantId(@Param("tenantId") UUID tenantId);
}
