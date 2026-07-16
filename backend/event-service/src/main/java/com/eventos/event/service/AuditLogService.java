package com.eventos.event.service;

import com.eventos.event.entity.AuditLog;
import com.eventos.event.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    private List<String> getEntityNamesForModule(String module) {
        if (module == null || module.equalsIgnoreCase("ALL")) {
            return null;
        }
        switch (module.toUpperCase()) {
            case "CRM":
                return Arrays.asList("Lead", "Quote", "Customer", "Contact");
            case "BOOKINGS":
                return Arrays.asList("Booking", "BookingAssignment", "TimelineTask", "Event");
            case "PAYMENTS":
                return Arrays.asList("Payment", "Invoice", "Expense", "InvoiceHistory", "VendorContract");
            case "GALLERY":
                return Arrays.asList("Album", "GalleryItem", "SharedAlbum");
            case "WORKSPACE":
                return Arrays.asList("Workspace", "Tenant", "Organization");
            case "SECURITY":
                return Arrays.asList("User", "Role", "SecurityEvent", "FailedLogin");
            case "INTEGRATIONS":
                return Arrays.asList("Webhook", "Integration");
            case "AUTOMATION":
                return Arrays.asList("Automation", "WorkflowRule");
            default:
                return Collections.singletonList(module);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getFilteredAuditLogs(
            UUID tenantId,
            String search,
            UUID performedBy,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String module,
            int page,
            int size) {
        
        List<String> entityNames = getEntityNamesForModule(module);
        Pageable pageable = PageRequest.of(page, size);
        if (entityNames == null || entityNames.isEmpty()) {
            return auditLogRepository.findFilteredWithoutEntityNames(tenantId, search, performedBy, startDate, endDate, pageable);
        } else {
            return auditLogRepository.findFilteredWithEntityNames(tenantId, search, performedBy, startDate, endDate, entityNames, pageable);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAllFilteredAuditLogsList(
            UUID tenantId,
            String search,
            UUID performedBy,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String module) {
        
        List<String> entityNames = getEntityNamesForModule(module);
        Pageable pageable = Pageable.unpaged();
        if (entityNames == null || entityNames.isEmpty()) {
            return auditLogRepository.findFilteredWithoutEntityNames(tenantId, search, performedBy, startDate, endDate, pageable).getContent();
        } else {
            return auditLogRepository.findFilteredWithEntityNames(tenantId, search, performedBy, startDate, endDate, entityNames, pageable).getContent();
        }
    }

    @Transactional
    public void deleteAuditLogsOlderThan(int days, UUID tenantId) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        List<AuditLog> logs = auditLogRepository.findAll();
        List<AuditLog> toDelete = new ArrayList<>();
        for (AuditLog log : logs) {
            if (log.getTenantId().equals(tenantId) && log.getCreatedAt().isBefore(cutoff)) {
                toDelete.add(log);
            }
        }
        auditLogRepository.deleteAll(toDelete);
    }

    public String exportToCsv(List<AuditLog> logs) {
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Timestamp,Entity,EntityID,Action,PerformedBy,Details\n");
        for (AuditLog log : logs) {
            csv.append(log.getId()).append(",")
               .append(log.getCreatedAt()).append(",")
               .append(escapeCsvField(log.getEntityName())).append(",")
               .append(log.getEntityId()).append(",")
               .append(escapeCsvField(log.getAction())).append(",")
               .append(log.getPerformedBy()).append(",")
               .append(escapeCsvField(log.getPayloadDiff()))
               .append("\n");
        }
        return csv.toString();
    }

    private String escapeCsvField(String field) {
        if (field == null) return "";
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}
