package com.eventos.event.repository;

import com.eventos.event.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findAllByTenantIdOrderByTransactionDateDesc(UUID tenantId);
    Optional<Transaction> findByIdAndTenantId(UUID id, UUID tenantId);
    List<Transaction> findAllByInvoiceIdAndTenantId(UUID invoiceId, UUID tenantId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.tenantId = :tenantId AND t.type = :type")
    BigDecimal sumAmountByTenantIdAndType(@Param("tenantId") UUID tenantId, @Param("type") String type);

    @Query("SELECT t.type, COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.tenantId = :tenantId GROUP BY t.type")
    List<Object[]> sumAmountByTenantIdGroupedByType(@Param("tenantId") UUID tenantId);
}
