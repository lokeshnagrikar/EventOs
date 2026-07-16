package com.eventos.auth.repository;

import com.eventos.auth.entity.BillingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BillingHistoryRepository extends JpaRepository<BillingHistory, UUID> {
    List<BillingHistory> findByTenantId(UUID tenantId);
}
