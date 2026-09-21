package com.eventos.auth.repository;

import com.eventos.auth.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
    List<SupportTicket> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<SupportTicket> findByStatusOrderByCreatedAtDesc(String status);
}
