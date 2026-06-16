package com.eventos.event.service;

import com.eventos.event.dto.CreateBudgetEstimateDto;
import com.eventos.event.entity.BudgetEstimate;
import com.eventos.event.entity.PricingRule;
import com.eventos.event.repository.BudgetEstimateRepository;
import com.eventos.event.repository.PricingRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BudgetServiceTest {

    @Mock
    private BudgetEstimateRepository budgetEstimateRepository;

    @Mock
    private PricingRuleRepository pricingRuleRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private BudgetService budgetService;

    private UUID tenantId;
    private BudgetEstimate mockEstimate;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        mockEstimate = BudgetEstimate.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .eventName("Sethi Corporate Gala Dinner")
                .eventType("CORPORATE")
                .guestCount(200)
                .decorStyle("PREMIUM")
                .venueType("HOTEL")
                .effectsList("DRY_ICE,COLD_PYRO")
                .cateringTotal(BigDecimal.valueOf(170000)) // 200 * 850
                .decorTotal(BigDecimal.valueOf(150000))
                .venueTotal(BigDecimal.valueOf(100000))
                .effectsTotal(BigDecimal.valueOf(23000)) // 8000 + 15000
                .grandTotal(BigDecimal.valueOf(443000))
                .clientName("Alice Sethi")
                .clientEmail("alice@sethi.com")
                .clientPhone("+91 99999 88888")
                .build();

        budgetService.setRestTemplate(restTemplate);
    }

    @Test
    void testGetAllEstimates() {
        when(budgetEstimateRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId))
                .thenReturn(Collections.singletonList(mockEstimate));

        List<BudgetEstimate> list = budgetService.getAllEstimates(tenantId);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("Sethi Corporate Gala Dinner", list.get(0).getEventName());
        verify(budgetEstimateRepository, times(1)).findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Test
    void testCalculateEstimate_MathCorrect() {
        CreateBudgetEstimateDto dto = CreateBudgetEstimateDto.builder()
                .eventName("Roy Wedding Ceremony")
                .eventType("WEDDING") // fallback plate cost = 1200
                .guestCount(150) // catering total = 180000
                .venueType("RESORT") // fallback venue total = 150000
                .decorStyle("ROYAL") // fallback decor cost = 350000
                .effectsList(Arrays.asList("COLD_PYRO", "LASER_SHOW")) // fallback effects = 15000 + 25000 = 40000
                .build();

        // mock return empty for findByTenantIdAndCategoryAndRuleKey so it uses defaults
        when(pricingRuleRepository.findAllByTenantId(tenantId)).thenReturn(Collections.emptyList());

        // grandTotal = 180000 + 150000 + 350000 + 40000 = 720000
        BudgetEstimate result = budgetService.calculateEstimate(dto, tenantId);

        assertNotNull(result);
        assertEquals(0, result.getCateringTotal().compareTo(BigDecimal.valueOf(180000)));
        assertEquals(0, result.getVenueTotal().compareTo(BigDecimal.valueOf(150000)));
        assertEquals(0, result.getDecorTotal().compareTo(BigDecimal.valueOf(350000)));
        assertEquals(0, result.getEffectsTotal().compareTo(BigDecimal.valueOf(40000)));
        assertEquals(0, result.getGrandTotal().compareTo(BigDecimal.valueOf(720000)));
        assertEquals("COLD_PYRO,LASER_SHOW", result.getEffectsList());
    }

    @Test
    void testConvertToLead_Success() {
        when(budgetEstimateRepository.findByIdAndTenantId(mockEstimate.getId(), tenantId))
                .thenReturn(Optional.of(mockEstimate));

        Map<String, Object> mockLeadData = new HashMap<>();
        mockLeadData.put("id", UUID.randomUUID().toString());
        mockLeadData.put("name", "Alice Sethi");

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("data", mockLeadData);

        when(restTemplate.exchange(
                eq("http://localhost:8082/api/v1/crm/leads"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(new ResponseEntity<>(mockResponse, HttpStatus.OK));

        Map<?, ?> result = budgetService.convertToLead(mockEstimate.getId(), tenantId, "Bearer JWT");

        assertNotNull(result);
        assertEquals("Alice Sethi", result.get("name"));
        verify(restTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void testGenerateQuoteFromEstimate_Success() {
        when(budgetEstimateRepository.findByIdAndTenantId(mockEstimate.getId(), tenantId))
                .thenReturn(Optional.of(mockEstimate));

        UUID generatedLeadId = UUID.randomUUID();

        // 1. Stub CRM Lead generation call
        Map<String, Object> mockLeadData = new HashMap<>();
        mockLeadData.put("id", generatedLeadId.toString());
        mockLeadData.put("name", "Alice Sethi");

        Map<String, Object> mockLeadResponse = new HashMap<>();
        mockLeadResponse.put("success", true);
        mockLeadResponse.put("data", mockLeadData);

        when(restTemplate.exchange(
                eq("http://localhost:8082/api/v1/crm/leads"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(new ResponseEntity<>(mockLeadResponse, HttpStatus.OK));

        // 2. Stub CRM Quote generation call
        Map<String, Object> mockQuoteData = new HashMap<>();
        mockQuoteData.put("id", UUID.randomUUID().toString());
        mockQuoteData.put("quoteNumber", "QT-0999");

        Map<String, Object> mockQuoteResponse = new HashMap<>();
        mockQuoteResponse.put("success", true);
        mockQuoteResponse.put("data", mockQuoteData);

        when(restTemplate.exchange(
                eq("http://localhost:8082/api/v1/crm/quotes"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(new ResponseEntity<>(mockQuoteResponse, HttpStatus.OK));

        Map<?, ?> result = budgetService.generateQuoteFromEstimate(mockEstimate.getId(), tenantId, "Bearer JWT");

        assertNotNull(result);
        assertEquals("QT-0999", result.get("quoteNumber"));
        // Should perform exactly 2 REST calls (one for lead creation, one for quote creation)
        verify(restTemplate, times(2)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void testDeleteEstimate_TenantIsolationSecure() {
        UUID otherTenantId = UUID.randomUUID();
        when(budgetEstimateRepository.findByIdAndTenantId(mockEstimate.getId(), otherTenantId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            budgetService.deleteEstimate(mockEstimate.getId(), otherTenantId);
        });

        verify(budgetEstimateRepository, times(1)).findByIdAndTenantId(mockEstimate.getId(), otherTenantId);
        verify(budgetEstimateRepository, never()).delete(any(BudgetEstimate.class));
    }
}
