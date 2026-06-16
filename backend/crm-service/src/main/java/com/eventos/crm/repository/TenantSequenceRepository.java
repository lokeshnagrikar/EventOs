package com.eventos.crm.repository;

import com.eventos.crm.entity.TenantSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantSequenceRepository extends JpaRepository<TenantSequence, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM TenantSequence s WHERE s.tenantId = :tenantId AND s.sequenceType = :sequenceType")
    Optional<TenantSequence> findByTenantIdAndSequenceTypeForUpdate(
            @Param("tenantId") UUID tenantId, 
            @Param("sequenceType") String sequenceType);
}
