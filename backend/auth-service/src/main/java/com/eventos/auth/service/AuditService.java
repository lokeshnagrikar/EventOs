package com.eventos.auth.service;

import com.eventos.auth.entity.AuditLog;
import com.eventos.auth.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> getAuditLogs(UUID tenantId, String search, String actionFilter) {
        List<AuditLog> logs = auditLogRepository.findAllByTenantId(tenantId);
        
        return logs.stream()
                .filter(l -> search == null || search.isEmpty() || 
                        (l.getDetails() != null && l.getDetails().toLowerCase().contains(search.toLowerCase())) ||
                        l.getAction().toLowerCase().contains(search.toLowerCase()))
                .filter(l -> actionFilter == null || actionFilter.isEmpty() || 
                        l.getAction().equalsIgnoreCase(actionFilter))
                .sorted(Comparator.comparing(AuditLog::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }
}
