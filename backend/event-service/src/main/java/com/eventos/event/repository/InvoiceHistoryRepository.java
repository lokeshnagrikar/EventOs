package com.eventos.event.repository;

import com.eventos.event.entity.InvoiceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface InvoiceHistoryRepository extends JpaRepository<InvoiceHistory, UUID> {
    List<InvoiceHistory> findAllByInvoiceIdAndTenantIdOrderByActionAtDesc(UUID invoiceId, UUID tenantId);
}
