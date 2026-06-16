package com.eventos.event.service;

import com.eventos.event.dto.CreateBudgetEstimateDto;
import com.eventos.event.entity.BudgetEstimate;
import com.eventos.event.entity.PricingRule;
import com.eventos.event.repository.BudgetEstimateRepository;
import com.eventos.event.repository.PricingRuleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional
public class BudgetService {

    private static final Logger log = LoggerFactory.getLogger(BudgetService.class);

    private final BudgetEstimateRepository budgetEstimateRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private RestTemplate restTemplate = new RestTemplate();

    public BudgetService(BudgetEstimateRepository budgetEstimateRepository,
                         PricingRuleRepository pricingRuleRepository) {
        this.budgetEstimateRepository = budgetEstimateRepository;
        this.pricingRuleRepository = pricingRuleRepository;
    }

    public void setRestTemplate(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Transactional(readOnly = true)
    public List<BudgetEstimate> getAllEstimates(UUID tenantId) {
        return budgetEstimateRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public BudgetEstimate getEstimateById(UUID id, UUID tenantId) {
        return budgetEstimateRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Budget estimate not found or access denied"));
    }

    public void deleteEstimate(UUID id, UUID tenantId) {
        BudgetEstimate estimate = getEstimateById(id, tenantId);
        budgetEstimateRepository.delete(estimate);
    }

    public BudgetEstimate calculateEstimate(CreateBudgetEstimateDto dto) {
        // Fallback for non-tenant legacy calculations (e.g. basic tests)
        UUID defaultTenant = UUID.fromString("00000000-0000-0000-0000-000000000000");
        return calculateEstimate(dto, defaultTenant);
    }

    public BudgetEstimate calculateEstimate(CreateBudgetEstimateDto dto, UUID tenantId) {
        ensurePricingRulesSeeded(tenantId);

        // 1. Catering calculation
        BigDecimal plateCost = getPricingValue(tenantId, "EVENT_TYPE", dto.getEventType(), getPlateCostFallback(dto.getEventType()));
        BigDecimal cateringTotal = plateCost.multiply(BigDecimal.valueOf(dto.getGuestCount()));

        // 2. Venue calculation
        BigDecimal venueTotal = getPricingValue(tenantId, "VENUE_TYPE", dto.getVenueType(), getVenueCostFallback(dto.getVenueType()));

        // 3. Decor calculation
        BigDecimal decorTotal = getPricingValue(tenantId, "DECOR_STYLE", dto.getDecorStyle(), getDecorCostFallback(dto.getDecorStyle()));

        // 4. Special Effects calculation
        BigDecimal effectsTotal = BigDecimal.ZERO;
        StringBuilder effectsJoined = new StringBuilder();

        if (dto.getEffectsList() != null) {
            for (String effect : dto.getEffectsList()) {
                BigDecimal fee = getPricingValue(tenantId, "ADD_ON", effect, getEffectFeeFallback(effect));
                effectsTotal = effectsTotal.add(fee);
                
                if (effectsJoined.length() > 0) {
                    effectsJoined.append(",");
                }
                effectsJoined.append(effect);
            }
        }

        BigDecimal grandTotal = cateringTotal.add(venueTotal).add(decorTotal).add(effectsTotal);

        return BudgetEstimate.builder()
                .tenantId(tenantId)
                .eventName(dto.getEventName())
                .eventType(dto.getEventType())
                .guestCount(dto.getGuestCount())
                .decorStyle(dto.getDecorStyle())
                .venueType(dto.getVenueType())
                .effectsList(effectsJoined.toString())
                .cateringTotal(cateringTotal)
                .decorTotal(decorTotal)
                .venueTotal(venueTotal)
                .effectsTotal(effectsTotal)
                .grandTotal(grandTotal)
                .clientName(dto.getClientName())
                .clientEmail(dto.getClientEmail())
                .clientPhone(dto.getClientPhone())
                .build();
    }

    public BudgetEstimate saveEstimate(CreateBudgetEstimateDto dto, UUID tenantId) {
        BudgetEstimate estimate = calculateEstimate(dto, tenantId);
        return budgetEstimateRepository.save(estimate);
    }

    // --- Pricing Rules CRUD ---

    @Transactional(readOnly = true)
    public List<PricingRule> getPricingRules(UUID tenantId) {
        ensurePricingRulesSeeded(tenantId);
        return pricingRuleRepository.findAllByTenantId(tenantId);
    }

    public PricingRule savePricingRule(PricingRule rule, UUID tenantId) {
        rule.setTenantId(tenantId);
        return pricingRuleRepository.save(rule);
    }

    public void deletePricingRule(UUID id, UUID tenantId) {
        PricingRule rule = pricingRuleRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Pricing rule not found"));
        pricingRuleRepository.delete(rule);
    }

    // --- CRM Integration Hook Endpoints ---

    public Map<?, ?> convertToLead(UUID estimateId, UUID tenantId, String authHeader) {
        BudgetEstimate estimate = getEstimateById(estimateId, tenantId);

        Map<String, Object> leadDto = new HashMap<>();
        leadDto.put("name", (estimate.getClientName() != null && !estimate.getClientName().isEmpty()) ? estimate.getClientName() : estimate.getEventName());
        leadDto.put("phone", estimate.getClientPhone());
        leadDto.put("email", estimate.getClientEmail());
        leadDto.put("eventType", estimate.getEventType());
        leadDto.put("budget", estimate.getGrandTotal());
        leadDto.put("leadSource", "Budget Calculator");
        leadDto.put("notes", String.format(
            "Auto-converted from Budget Estimate. Details: Guest Count=%d, Venue Type=%s, Decor Style=%s, Effects=%s",
            estimate.getGuestCount(), estimate.getVenueType(), estimate.getDecorStyle(), estimate.getEffectsList()
        ));

        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
            headers.set("X-Tenant-ID", tenantId.toString());
            org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(leadDto, headers);

            org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(
                    "http://localhost:8082/api/v1/crm/leads",
                    org.springframework.http.HttpMethod.POST,
                    entity,
                    Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<?, ?>) response.getBody().get("data");
            }
        } catch (Exception e) {
            log.error("Failed to convert budget estimate to Lead: {}", e.getMessage());
            throw new IllegalArgumentException("CRM Lead generation failed: " + e.getMessage());
        }
        throw new IllegalStateException("Invalid response from CRM lead service");
    }

    public Map<?, ?> generateQuoteFromEstimate(UUID estimateId, UUID tenantId, String authHeader) {
        BudgetEstimate estimate = getEstimateById(estimateId, tenantId);

        // 1. Establish/convert to lead first to get a valid leadId
        Map<?, ?> leadData = convertToLead(estimateId, tenantId, authHeader);
        String leadIdStr = (String) leadData.get("id");
        UUID leadId = UUID.fromString(leadIdStr);

        // 2. Map items
        List<Map<String, Object>> items = new ArrayList<>();

        // Catering line item
        Map<String, Object> cateringItem = new HashMap<>();
        cateringItem.put("itemName", "Catering Service (" + estimate.getEventType() + ")");
        cateringItem.put("description", "Per-plate catering fee for " + estimate.getGuestCount() + " guests.");
        cateringItem.put("unitPrice", estimate.getCateringTotal().divide(BigDecimal.valueOf(estimate.getGuestCount()), 2, java.math.RoundingMode.HALF_UP));
        cateringItem.put("quantity", estimate.getGuestCount());
        items.add(cateringItem);

        // Venue line item
        if (estimate.getVenueTotal() != null && estimate.getVenueTotal().compareTo(BigDecimal.ZERO) > 0) {
            Map<String, Object> venueItem = new HashMap<>();
            venueItem.put("itemName", "Venue Rental (" + estimate.getVenueType() + ")");
            venueItem.put("description", "Venue lease flat rate pricing.");
            venueItem.put("unitPrice", estimate.getVenueTotal());
            venueItem.put("quantity", 1);
            items.add(venueItem);
        }

        // Decor line item
        if (estimate.getDecorTotal() != null && estimate.getDecorTotal().compareTo(BigDecimal.ZERO) > 0) {
            Map<String, Object> decorItem = new HashMap<>();
            decorItem.put("itemName", "Decoration Package (" + estimate.getDecorStyle() + ")");
            decorItem.put("description", "Full themed layout installation.");
            decorItem.put("unitPrice", estimate.getDecorTotal());
            decorItem.put("quantity", 1);
            items.add(decorItem);
        }

        // Add-ons/Effects item
        if (estimate.getEffectsTotal() != null && estimate.getEffectsTotal().compareTo(BigDecimal.ZERO) > 0) {
            Map<String, Object> effectsItem = new HashMap<>();
            effectsItem.put("itemName", "Effects & Add-ons Packages");
            effectsItem.put("description", "Integrated setup: " + estimate.getEffectsList());
            effectsItem.put("unitPrice", estimate.getEffectsTotal());
            effectsItem.put("quantity", 1);
            items.add(effectsItem);
        }

        Map<String, Object> quoteDto = new HashMap<>();
        quoteDto.put("leadId", leadId);
        quoteDto.put("templateName", "MINIMALIST");
        quoteDto.put("discount", BigDecimal.ZERO);
        quoteDto.put("taxRate", BigDecimal.valueOf(18.00)); // 18% standard GST tax
        quoteDto.put("clientNotes", "Generated automatically from online Budget Estimate tool.");
        quoteDto.put("termsConditions", "Standard EventOS Terms and Conditions apply.");
        quoteDto.put("items", items);

        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
            headers.set("X-Tenant-ID", tenantId.toString());
            org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(quoteDto, headers);

            org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(
                    "http://localhost:8082/api/v1/crm/quotes",
                    org.springframework.http.HttpMethod.POST,
                    entity,
                    Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<?, ?>) response.getBody().get("data");
            }
        } catch (Exception e) {
            log.error("Failed to generate Quote from estimate: {}", e.getMessage());
            throw new IllegalArgumentException("CRM Quote generation failed: " + e.getMessage());
        }
        throw new IllegalStateException("Invalid response from CRM quote service");
    }

    // --- Internal Helpers & Pricing engine logic ---

    private BigDecimal getPricingValue(UUID tenantId, String category, String ruleKey, BigDecimal defaultValue) {
        if (pricingRuleRepository == null || ruleKey == null) {
            return defaultValue;
        }
        try {
            return pricingRuleRepository.findByTenantIdAndCategoryAndRuleKey(tenantId, category, ruleKey.toUpperCase())
                    .map(PricingRule::getBasePrice)
                    .orElse(defaultValue);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private void ensurePricingRulesSeeded(UUID tenantId) {
        if (pricingRuleRepository == null) return;
        try {
            List<PricingRule> rules = pricingRuleRepository.findAllByTenantId(tenantId);
            if (rules.isEmpty()) {
                log.info("Auto-seeding default Pricing Rules for Tenant: {}", tenantId);
                List<PricingRule> defaults = new ArrayList<>();

                // Event Types (Per plate)
                defaults.add(PricingRule.builder().tenantId(tenantId).category("EVENT_TYPE").ruleKey("WEDDING").basePrice(BigDecimal.valueOf(1200)).priceType("PER_GUEST").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("EVENT_TYPE").ruleKey("CORPORATE").basePrice(BigDecimal.valueOf(850)).priceType("PER_GUEST").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("EVENT_TYPE").ruleKey("ENGAGEMENT").basePrice(BigDecimal.valueOf(900)).priceType("PER_GUEST").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("EVENT_TYPE").ruleKey("BIRTHDAY").basePrice(BigDecimal.valueOf(500)).priceType("PER_GUEST").build());

                // Venue Types (Flat rate)
                defaults.add(PricingRule.builder().tenantId(tenantId).category("VENUE_TYPE").ruleKey("HOTEL").basePrice(BigDecimal.valueOf(100000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("VENUE_TYPE").ruleKey("HALL").basePrice(BigDecimal.valueOf(60000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("VENUE_TYPE").ruleKey("GARDEN").basePrice(BigDecimal.valueOf(80000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("VENUE_TYPE").ruleKey("RESORT").basePrice(BigDecimal.valueOf(150000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("VENUE_TYPE").ruleKey("BEACH").basePrice(BigDecimal.valueOf(120000)).priceType("FLAT_RATE").build());

                // Decor Styles (Flat rate)
                defaults.add(PricingRule.builder().tenantId(tenantId).category("DECOR_STYLE").ruleKey("STANDARD").basePrice(BigDecimal.valueOf(50000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("DECOR_STYLE").ruleKey("PREMIUM").basePrice(BigDecimal.valueOf(150000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("DECOR_STYLE").ruleKey("ROYAL").basePrice(BigDecimal.valueOf(350000)).priceType("FLAT_RATE").build());

                // Special Effects (Flat rate)
                defaults.add(PricingRule.builder().tenantId(tenantId).category("ADD_ON").ruleKey("COLD_PYRO").basePrice(BigDecimal.valueOf(15000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("ADD_ON").ruleKey("DRY_ICE").basePrice(BigDecimal.valueOf(8000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("ADD_ON").ruleKey("LASER_SHOW").basePrice(BigDecimal.valueOf(25000)).priceType("FLAT_RATE").build());
                defaults.add(PricingRule.builder().tenantId(tenantId).category("ADD_ON").ruleKey("LED_WALL").basePrice(BigDecimal.valueOf(40000)).priceType("FLAT_RATE").build());

                pricingRuleRepository.saveAll(defaults);
            }
        } catch (Exception e) {
            log.error("Failed to check/seed default pricing rules: {}", e.getMessage());
        }
    }

    private BigDecimal getPlateCostFallback(String type) {
        if (type == null) return BigDecimal.valueOf(600);
        switch (type.toUpperCase()) {
            case "WEDDING": return BigDecimal.valueOf(1200);
            case "CORPORATE": return BigDecimal.valueOf(850);
            case "ENGAGEMENT": return BigDecimal.valueOf(900);
            case "BIRTHDAY": return BigDecimal.valueOf(500);
            default: return BigDecimal.valueOf(600);
        }
    }

    private BigDecimal getVenueCostFallback(String type) {
        if (type == null) return BigDecimal.valueOf(60000);
        switch (type.toUpperCase()) {
            case "HOTEL": return BigDecimal.valueOf(100000);
            case "HALL": return BigDecimal.valueOf(60000);
            case "GARDEN": return BigDecimal.valueOf(80000);
            case "RESORT": return BigDecimal.valueOf(150000);
            case "BEACH": return BigDecimal.valueOf(120000);
            default: return BigDecimal.valueOf(60000);
        }
    }

    private BigDecimal getDecorCostFallback(String style) {
        if (style == null) return BigDecimal.valueOf(50000);
        switch (style.toUpperCase()) {
            case "STANDARD": return BigDecimal.valueOf(50000);
            case "PREMIUM": return BigDecimal.valueOf(150000);
            case "ROYAL": return BigDecimal.valueOf(350000);
            default: return BigDecimal.valueOf(50000);
        }
    }

    private BigDecimal getEffectFeeFallback(String effect) {
        if (effect == null) return BigDecimal.ZERO;
        switch (effect.toUpperCase()) {
            case "COLD_PYRO": return BigDecimal.valueOf(15000);
            case "DRY_ICE": return BigDecimal.valueOf(8000);
            case "LASER_SHOW": return BigDecimal.valueOf(25000);
            case "LED_WALL": return BigDecimal.valueOf(40000);
            default: return BigDecimal.ZERO;
        }
    }
}
