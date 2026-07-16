package com.eventos.event.repository;

import com.eventos.event.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId " +
           "AND (:search IS NULL OR LOWER(a.entityName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.payloadDiff) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:performedBy IS NULL OR a.performedBy = :performedBy) " +
           "AND (:startDate IS NULL OR a.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR a.createdAt <= :endDate) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findFilteredWithoutEntityNames(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            @Param("performedBy") UUID performedBy,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId " +
           "AND (:search IS NULL OR LOWER(a.entityName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.payloadDiff) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:performedBy IS NULL OR a.performedBy = :performedBy) " +
           "AND (:startDate IS NULL OR a.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR a.createdAt <= :endDate) " +
           "AND a.entityName IN :entityNames " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findFilteredWithEntityNames(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            @Param("performedBy") UUID performedBy,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("entityNames") List<String> entityNames,
            Pageable pageable
    );
}
