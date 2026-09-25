package com.eventos.event.service;

import com.eventos.event.entity.AuditLog;
import com.eventos.event.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
    }

    @Test
    void testGetFilteredAuditLogs_DefaultParameters() {
        AuditLog sampleLog = AuditLog.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .entityName("Booking")
                .entityId(UUID.randomUUID())
                .action("CREATE")
                .createdAt(LocalDateTime.now())
                .build();

        Page<AuditLog> page = new PageImpl<>(List.of(sampleLog));
        when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Page<AuditLog> result = auditLogService.getFilteredAuditLogs(tenantId, null, null, null, null, "ALL", 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Booking", result.getContent().get(0).getEntityName());
        verify(auditLogRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void testGetAllFilteredAuditLogsList() {
        AuditLog sampleLog = AuditLog.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .entityName("Event")
                .entityId(UUID.randomUUID())
                .action("UPDATE")
                .createdAt(LocalDateTime.now())
                .build();

        when(auditLogRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(sampleLog));

        List<AuditLog> list = auditLogService.getAllFilteredAuditLogsList(tenantId, "searchKeyword", null, null, null, "BOOKINGS");

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("Event", list.get(0).getEntityName());
    }

    @Test
    void testExportToCsv() {
        AuditLog sampleLog = AuditLog.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .entityName("Quote")
                .entityId(UUID.randomUUID())
                .action("APPROVE")
                .performedBy(UUID.randomUUID())
                .payloadDiff("{\"status\":\"APPROVED\"}")
                .createdAt(LocalDateTime.now())
                .build();

        String csv = auditLogService.exportToCsv(List.of(sampleLog));
        assertNotNull(csv);
        assertTrue(csv.contains("ID,Timestamp,Entity,EntityID,Action,PerformedBy,Details"));
        assertTrue(csv.contains("Quote"));
        assertTrue(csv.contains("APPROVE"));
    }
}
