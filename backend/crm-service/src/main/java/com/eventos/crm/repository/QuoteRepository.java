package com.eventos.crm.repository;

import com.eventos.crm.entity.Quote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
