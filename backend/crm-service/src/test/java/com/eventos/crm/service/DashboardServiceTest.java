package com.eventos.crm.service;

import com.eventos.crm.dto.DashboardMetricsDto;
import com.eventos.crm.entity.Lead;
import com.eventos.crm.entity.LeadStatus;
import com.eventos.crm.repository.LeadRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DashboardServiceTest {

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private DashboardService dashboardService;

    private UUID tenantId;
    private Lead mockLeadNew;
    private Lead mockLeadBooked;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        mockLeadNew = Lead.builder()
                .id(UUID.randomUUID())
                .name("Karan Malhotra")
                .status(LeadStatus.NEW)
                .budget(BigDecimal.valueOf(50000))
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .build();
        mockLeadNew.setTenantId(tenantId);

        mockLeadBooked = Lead.builder()
                .id(UUID.randomUUID())
                .name("Anjali Sharma")
                .status(LeadStatus.WON)
                .budget(BigDecimal.valueOf(150000))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .isDeleted(false)
                .build();
        mockLeadBooked.setTenantId(tenantId);
    }

    @Test
    void testGetMetricsForTenant_CacheHit() throws Exception {
        String cacheKey = "dashboard:metrics:" + tenantId.toString() + ":ADMIN";
        DashboardMetricsDto cachedDto = DashboardMetricsDto.builder()
                .visibleWidgets(Collections.singletonList("totalLeads"))
                .build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(cacheKey)).thenReturn("some-cached-json");
        when(objectMapper.readValue("some-cached-json", DashboardMetricsDto.class)).thenReturn(cachedDto);

        DashboardMetricsDto result = dashboardService.getMetricsForTenant(tenantId, "ADMIN");

        assertNotNull(result);
        assertEquals(1, result.getVisibleWidgets().size());
        assertEquals("totalLeads", result.getVisibleWidgets().get(0));
        verify(leadRepository, never()).countByTenantIdAndIsDeletedFalse(any(UUID.class));
    }

    @Test
    void testGetMetricsForTenant_CacheMiss_AdminRole() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);
        when(leadRepository.countByTenantIdAndIsDeletedFalse(tenantId)).thenReturn(2L);
        when(leadRepository.countByTenantIdAndStatusInAndIsDeletedFalse(tenantId, List.of(LeadStatus.WON))).thenReturn(1L);
        when(leadRepository.sumBudgetByTenantIdAndStatusInAndIsDeletedFalse(eq(tenantId),
                eq(List.of(LeadStatus.NEW, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL_SENT, LeadStatus.NEGOTIATION))))
                .thenReturn(BigDecimal.valueOf(100000));
        when(leadRepository.sumBudgetByTenantIdAndStatusInAndIsDeletedFalse(eq(tenantId),
                eq(List.of(LeadStatus.WON))))
                .thenReturn(BigDecimal.valueOf(150000));
        when(leadRepository.findTop3ByTenantIdAndIsDeletedFalseOrderByUpdatedAtDesc(tenantId))
                .thenReturn(Arrays.asList(mockLeadNew, mockLeadBooked));

        DashboardMetricsDto result = dashboardService.getMetricsForTenant(tenantId, "ADMIN");

        assertNotNull(result);
        assertTrue(result.getVisibleWidgets().contains("totalLeads"));
        assertTrue(result.getVisibleWidgets().contains("revenueMetrics"));
        assertEquals(2, result.getLeadMetrics().getTotalLeads());
        assertEquals(50.0, result.getLeadMetrics().getConversionRate()); // 1 out of 2 won
        assertEquals(0, result.getLeadMetrics().getPipelineValue().compareTo(BigDecimal.valueOf(100000)));
        assertEquals(0, result.getLeadMetrics().getRevenueForecast().compareTo(BigDecimal.valueOf(200000))); // 150000 + 100000 * 0.5 = 200000
        assertNotNull(result.getRevenueMetrics());
    }

    @Test
    void testGetMetricsForTenant_CacheMiss_StaffRole() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);
        when(leadRepository.countByTenantIdAndIsDeletedFalse(tenantId)).thenReturn(2L);
        when(leadRepository.countByTenantIdAndStatusInAndIsDeletedFalse(tenantId, List.of(LeadStatus.WON))).thenReturn(1L);
        when(leadRepository.sumBudgetByTenantIdAndStatusInAndIsDeletedFalse(eq(tenantId),
                eq(List.of(LeadStatus.NEW, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL_SENT, LeadStatus.NEGOTIATION))))
                .thenReturn(BigDecimal.valueOf(100000));
        when(leadRepository.sumBudgetByTenantIdAndStatusInAndIsDeletedFalse(eq(tenantId),
                eq(List.of(LeadStatus.WON))))
                .thenReturn(BigDecimal.valueOf(150000));
        when(leadRepository.findTop3ByTenantIdAndIsDeletedFalseOrderByUpdatedAtDesc(tenantId))
                .thenReturn(Arrays.asList(mockLeadNew, mockLeadBooked));

        DashboardMetricsDto result = dashboardService.getMetricsForTenant(tenantId, "STAFF");

        assertNotNull(result);
        assertTrue(result.getVisibleWidgets().contains("totalLeads"));
        assertFalse(result.getVisibleWidgets().contains("revenueMetrics")); // STAFF hides revenue overview metrics
        assertNull(result.getRevenueMetrics());
        assertEquals(2, result.getLeadMetrics().getTotalLeads());
        assertEquals(50.0, result.getLeadMetrics().getConversionRate());
        assertEquals(0, result.getLeadMetrics().getPipelineValue().compareTo(BigDecimal.valueOf(100000)));
        assertEquals(0, result.getLeadMetrics().getRevenueForecast().compareTo(BigDecimal.valueOf(200000)));
    }

    @Test
    void testGetMetricsForTenant_CacheMiss_ClientRole() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);
        when(leadRepository.countByTenantIdAndIsDeletedFalse(tenantId)).thenReturn(0L);
        when(leadRepository.countByTenantIdAndStatusInAndIsDeletedFalse(tenantId, List.of(LeadStatus.WON))).thenReturn(0L);
        when(leadRepository.sumBudgetByTenantIdAndStatusInAndIsDeletedFalse(eq(tenantId), any())).thenReturn(BigDecimal.ZERO);
        when(leadRepository.findTop3ByTenantIdAndIsDeletedFalseOrderByUpdatedAtDesc(tenantId))
                .thenReturn(Collections.emptyList());

        DashboardMetricsDto result = dashboardService.getMetricsForTenant(tenantId, "CLIENT");

        assertNotNull(result);
        assertFalse(result.getVisibleWidgets().contains("totalLeads")); // CLIENT hides lead widgets
        assertNull(result.getLeadMetrics());
        assertTrue(result.getVisibleWidgets().contains("pendingPayments"));
    }
}
