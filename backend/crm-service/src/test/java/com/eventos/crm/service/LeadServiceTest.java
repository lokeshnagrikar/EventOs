package com.eventos.crm.service;

import com.eventos.crm.dto.CreateLeadDto;
import com.eventos.crm.entity.Lead;
import com.eventos.crm.entity.LeadActivity;
import com.eventos.crm.entity.LeadStatus;
import com.eventos.crm.repository.LeadActivityRepository;
import com.eventos.crm.repository.LeadRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LeadServiceTest {

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private LeadActivityRepository leadActivityRepository;

    @InjectMocks
    private LeadService leadService;

    private UUID tenantId;
    private UUID companyId;
    private UUID userId;
    private Lead mockLead;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();

        mockLead = Lead.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .companyId(companyId)
                .name("Kapoor Wedding")
                .eventType("WEDDING")
                .budget(BigDecimal.valueOf(500000))
                .status(LeadStatus.NEW)
                .isDeleted(false)
                .build();

        setSecurityContext(userId, tenantId, "OWNER");
    }

    @AfterEach
    void tearDown() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    private void setSecurityContext(UUID userId, UUID tenantId, String role) {
        com.eventos.crm.config.UserPrincipal principal = new com.eventos.crm.config.UserPrincipal(
                userId, tenantId, "user@test.com", role);
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        lenient().when(auth.getPrincipal()).thenReturn(principal);
        org.springframework.security.core.context.SecurityContext context = mock(org.springframework.security.core.context.SecurityContext.class);
        lenient().when(context.getAuthentication()).thenReturn(auth);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);
    }

    @Test
    @SuppressWarnings("unchecked")
    void testGetAllLeads() {
        when(leadRepository.findAll(any(Specification.class)))
                .thenReturn(Collections.singletonList(mockLead));

        List<Lead> leads = leadService.getAllLeads(tenantId);

        assertNotNull(leads);
        assertEquals(1, leads.size());
        assertEquals("Kapoor Wedding", leads.get(0).getName());
        verify(leadRepository, times(1)).findAll(any(Specification.class));
    }

    @Test
    void testCreateLead() {
        CreateLeadDto dto = CreateLeadDto.builder()
                .name("Tata Meet")
                .eventType("CORPORATE")
                .budget(BigDecimal.valueOf(100000))
                .phone("1234567890")
                .email("tata@corp.com")
                .build();

        Lead savedLead = Lead.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .companyId(companyId)
                .name(dto.getName())
                .eventType(dto.getEventType())
                .budget(dto.getBudget())
                .status(LeadStatus.NEW)
                .build();

        when(leadRepository.save(any(Lead.class))).thenReturn(savedLead);
        when(leadActivityRepository.save(any(LeadActivity.class))).thenReturn(new LeadActivity());

        Lead result = leadService.createLead(dto, tenantId, companyId, userId);

        assertNotNull(result);
        assertEquals(LeadStatus.NEW, result.getStatus());
        assertEquals("Tata Meet", result.getName());
        verify(leadRepository, times(1)).save(any(Lead.class));
        verify(leadActivityRepository, times(1)).save(any(LeadActivity.class));
    }

    @Test
    void testCreateLead_AccessDeniedForStaff() {
        setSecurityContext(userId, tenantId, "STAFF");

        CreateLeadDto dto = CreateLeadDto.builder()
                .name("Tata Meet")
                .build();

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
            leadService.createLead(dto, tenantId, companyId, userId);
        });

        verify(leadRepository, never()).save(any(Lead.class));
    }

    @Test
    void testUpdateLeadStatus() {
        UUID leadId = mockLead.getId();
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));
        
        Lead updatedLead = Lead.builder()
                .id(leadId)
                .tenantId(tenantId)
                .companyId(companyId)
                .name(mockLead.getName())
                .status(LeadStatus.CONTACTED)
                .build();

        when(leadRepository.save(any(Lead.class))).thenReturn(updatedLead);
        when(leadActivityRepository.save(any(LeadActivity.class))).thenReturn(new LeadActivity());

        Lead result = leadService.updateLeadStatus(leadId, LeadStatus.CONTACTED, tenantId, userId);

        assertNotNull(result);
        assertEquals(LeadStatus.CONTACTED, result.getStatus());
        verify(leadRepository, times(1)).findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId);
        verify(leadRepository, times(1)).save(any(Lead.class));
        verify(leadActivityRepository, times(1)).save(any(LeadActivity.class));
    }

    @Test
    void testUpdateLeadStatus_NotFound() {
        UUID leadId = UUID.randomUUID();
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            leadService.updateLeadStatus(leadId, LeadStatus.CONTACTED, tenantId, userId);
        });

        verify(leadRepository, times(1)).findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId);
        verify(leadRepository, never()).save(any(Lead.class));
    }

    @Test
    void testUpdateLead_Success() {
        UUID leadId = mockLead.getId();
        CreateLeadDto dto = CreateLeadDto.builder()
                .name("Updated Kapoor Wedding")
                .phone("9999999999")
                .email("updated@kapoor.com")
                .eventType("WEDDING")
                .budget(BigDecimal.valueOf(600000))
                .leadSource("Referral")
                .notes("Notes update")
                .assignedUserId(userId)
                .build();

        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Lead result = leadService.updateLead(leadId, dto, tenantId, userId);

        assertNotNull(result);
        assertEquals("Updated Kapoor Wedding", result.getName());
        assertEquals("9999999999", result.getPhone());
        assertEquals("updated@kapoor.com", result.getEmail());
        assertEquals("Referral", result.getLeadSource());
        assertEquals(userId, result.getAssignedUserId());
        verify(leadRepository, times(1)).save(any(Lead.class));
    }

    @Test
    void testDeleteLead_Success() {
        UUID leadId = mockLead.getId();
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(invocation -> invocation.getArgument(0));

        leadService.deleteLead(leadId, tenantId, userId);

        assertTrue(mockLead.isDeleted());
        verify(leadRepository, times(1)).save(mockLead);
    }

    @Test
    void testDeleteLead_AccessDeniedForManager() {
        setSecurityContext(userId, tenantId, "MANAGER");
        UUID leadId = mockLead.getId();
        when(leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId))
                .thenReturn(Optional.of(mockLead));

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
            leadService.deleteLead(leadId, tenantId, userId);
        });

        verify(leadRepository, never()).save(mockLead);
    }
}
