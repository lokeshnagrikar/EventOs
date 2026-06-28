package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.CreateBudgetEstimateDto;
import com.eventos.event.entity.BudgetEstimate;
import com.eventos.event.entity.PricingCategory;
import com.eventos.event.entity.PricingRule;
import com.eventos.event.entity.PricingType;
import com.eventos.event.repository.BudgetEstimateRepository;
import com.eventos.event.repository.PricingRuleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Tag(name = "Budget Calculator", description = "Calculate event costs, manage budget estimates, seed pricing rules, and promote estimates to CRM Leads and Quotes")
@RestController
@RequestMapping("/calculator")
@SuppressWarnings({"null", "rawtypes"})
public class BudgetCalculatorController {

    private static final Logger log = LoggerFactory.getLogger(BudgetCalculatorController.class);

    private final BudgetEstimateRepository budgetEstimateRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${service.crm.base-url:http://localhost:8082/api/v1/crm}")
    private String crmServiceBaseUrl;

    public BudgetCalculatorController(BudgetEstimateRepository budgetEstimateRepository,
                                      PricingRuleRepository pricingRuleRepository) {
        this.budgetEstimateRepository = budgetEstimateRepository;
        this.pricingRuleRepository = pricingRuleRepository;
    }

    private UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication context is missing");
    }

    private UUID getTenantId() {
        UUID tenantId = getCurrentPrincipal().getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant ID context is missing");
        }
        return tenantId;
    }

    private String getAuthorizationHeader() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attr =
                    (org.springframework.web.context.request.ServletRequestAttributes)
                            org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attr != null) {
                return attr.getRequest().getHeader("Authorization");
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    @Operation(summary = "Get list of pricing rules")
    @GetMapping("/pricing-rules")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')")
    public ResponseEntity<?> getPricingRules() {
        UUID tenantId = getTenantId();
        seedDefaultPricingRules(tenantId);
        List<PricingRule> rules = pricingRuleRepository.findAllByTenantId(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", rules);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get saved budget estimates")
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getBudgetEstimates() {
        UUID tenantId = getTenantId();
        List<BudgetEstimate> estimates = budgetEstimateRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", estimates);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Save budget estimate")
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> createBudgetEstimate(@Valid @RequestBody CreateBudgetEstimateDto dto) {
        UUID tenantId = getTenantId();
        seedDefaultPricingRules(tenantId);

        // Fetch pricing rule prices
        BigDecimal plateCost = getPrice(tenantId, PricingCategory.EVENT_TYPE, dto.getEventType(), getPlateCostFallback(dto.getEventType()));
        BigDecimal cateringTotal = plateCost.multiply(BigDecimal.valueOf(dto.getGuestCount()));

        BigDecimal venueTotal = getPrice(tenantId, PricingCategory.VENUE_TYPE, dto.getVenueType(), getVenueCostFallback(dto.getVenueType()));
        BigDecimal decorTotal = getPrice(tenantId, PricingCategory.DECOR_STYLE, dto.getDecorStyle(), getDecorCostFallback(dto.getDecorStyle()));

        BigDecimal effectsTotal = BigDecimal.ZERO;
        if (dto.getEffectsList() != null) {
            for (String effect : dto.getEffectsList()) {
                BigDecimal effectPrice = getPrice(tenantId, PricingCategory.ADD_ON, effect, getEffectFeeFallback(effect));
                effectsTotal = effectsTotal.add(effectPrice);
            }
        }

        BigDecimal subtotal = cateringTotal.add(venueTotal).add(decorTotal).add(effectsTotal);
        BigDecimal taxAmount = subtotal.multiply(BigDecimal.valueOf(0.18));
        BigDecimal grandTotal = subtotal.add(taxAmount);

        BudgetEstimate estimate = BudgetEstimate.builder()
                .tenantId(tenantId)
                .eventName(dto.getEventName())
                .eventType(dto.getEventType())
                .guestCount(dto.getGuestCount())
                .decorStyle(dto.getDecorStyle())
                .venueType(dto.getVenueType())
                .clientName(dto.getClientName())
                .clientEmail(dto.getClientEmail())
                .clientPhone(dto.getClientPhone())
                .effectsList(dto.getEffectsList() != null ? String.join(",", dto.getEffectsList()) : "")
                .cateringTotal(cateringTotal)
                .decorTotal(decorTotal)
                .venueTotal(venueTotal)
                .effectsTotal(effectsTotal)
                .grandTotal(grandTotal)
                .build();

        BudgetEstimate saved = budgetEstimateRepository.save(estimate);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Delete budget estimate")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> deleteBudgetEstimate(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        BudgetEstimate estimate = budgetEstimateRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estimate not found"));

        budgetEstimateRepository.delete(estimate);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Estimate deleted successfully");
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Convert budget estimate to CRM Lead")
    @PostMapping("/{id}/convert-to-lead")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> convertToLead(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        BudgetEstimate estimate = budgetEstimateRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estimate not found"));

        if (estimate.getLeadId() != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            Map<String, Object> data = new HashMap<>();
            data.put("id", estimate.getLeadId().toString());
            response.put("data", data);
            return ResponseEntity.ok(response);
        }

        String authHeader = getAuthorizationHeader();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        headers.set("X-Tenant-ID", tenantId.toString());

        Map<String, Object> body = new HashMap<>();
        body.put("name", estimate.getClientName() != null && !estimate.getClientName().trim().isEmpty() ? estimate.getClientName() : estimate.getEventName());
        body.put("phone", estimate.getClientPhone());
        body.put("email", estimate.getClientEmail() != null && !estimate.getClientEmail().trim().isEmpty() ? estimate.getClientEmail() : "info@client.com");
        body.put("eventType", estimate.getEventType());
        body.put("budget", estimate.getGrandTotal());
        body.put("leadSource", "WEBSITE");
        body.put("notes", "Generated from Budget Estimate: " + estimate.getEventName());

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    crmServiceBaseUrl + "/leads",
                    requestEntity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> responseBody = response.getBody();
                Map<?, ?> dataMap = (Map<?, ?>) responseBody.get("data");
                if (dataMap != null) {
                    String leadIdStr = (String) dataMap.get("id");
                    if (leadIdStr != null) {
                        estimate.setLeadId(UUID.fromString(leadIdStr));
                        budgetEstimateRepository.save(estimate);
                        
                        Map<String, Object> successRes = new HashMap<>();
                        successRes.put("success", true);
                        successRes.put("data", dataMap);
                        return ResponseEntity.ok(successRes);
                    }
                }
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create CRM Lead");
        } catch (Exception e) {
            log.error("Failed to promote estimate to lead: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to promote estimate to lead: " + e.getMessage());
        }
    }

    @Operation(summary = "Generate CRM Quote proposal from estimate")
    @PostMapping("/{id}/generate-quote")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> generateQuote(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        BudgetEstimate estimate = budgetEstimateRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estimate not found"));

        // Generate Lead first if not present
        if (estimate.getLeadId() == null) {
            convertToLead(id);
            estimate = budgetEstimateRepository.findByIdAndTenantId(id, tenantId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estimate not found"));
        }

        if (estimate.getQuoteId() != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            Map<String, Object> data = new HashMap<>();
            data.put("id", estimate.getQuoteId().toString());
            response.put("data", data);
            return ResponseEntity.ok(response);
        }

        String authHeader = getAuthorizationHeader();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        headers.set("X-Tenant-ID", tenantId.toString());

        List<Map<String, Object>> items = new ArrayList<>();
        if (estimate.getCateringTotal() != null && estimate.getCateringTotal().compareTo(BigDecimal.ZERO) > 0) {
            Map<String, Object> item = new HashMap<>();
            item.put("itemName", "Catering (" + estimate.getGuestCount() + " guests)");
            item.put("description", "Premium catering service for " + estimate.getGuestCount() + " guests");
            item.put("quantity", estimate.getGuestCount());
            item.put("unitPrice", estimate.getCateringTotal().divide(BigDecimal.valueOf(estimate.getGuestCount()), 2, RoundingMode.HALF_UP));
            items.add(item);
        }
        if (estimate.getVenueTotal() != null && estimate.getVenueTotal().compareTo(BigDecimal.ZERO) > 0) {
            Map<String, Object> item = new HashMap<>();
            item.put("itemName", "Venue Rental (" + estimate.getVenueType() + ")");
            item.put("description", "Venue reservation for " + estimate.getVenueType());
            item.put("quantity", 1);
            item.put("unitPrice", estimate.getVenueTotal());
            items.add(item);
        }
        if (estimate.getDecorTotal() != null && estimate.getDecorTotal().compareTo(BigDecimal.ZERO) > 0) {
            Map<String, Object> item = new HashMap<>();
            item.put("itemName", "Decorations (" + estimate.getDecorStyle() + " style)");
            item.put("description", "Event theme decorations: " + estimate.getDecorStyle());
            item.put("quantity", 1);
            item.put("unitPrice", estimate.getDecorTotal());
            items.add(item);
        }
        if (estimate.getEffectsTotal() != null && estimate.getEffectsTotal().compareTo(BigDecimal.ZERO) > 0) {
            Map<String, Object> item = new HashMap<>();
            item.put("itemName", "Special Effects / AV");
            item.put("description", "Add-on effects: " + estimate.getEffectsList());
            item.put("quantity", 1);
            item.put("unitPrice", estimate.getEffectsTotal());
            items.add(item);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("leadId", estimate.getLeadId().toString());
        body.put("discount", BigDecimal.ZERO);
        body.put("taxRate", BigDecimal.valueOf(18));
        body.put("clientNotes", "Generated from Budget Estimate Plan");
        body.put("termsConditions", "Standard event service terms apply");
        body.put("items", items);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    crmServiceBaseUrl + "/quotes",
                    requestEntity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> responseBody = response.getBody();
                Map<?, ?> dataMap = (Map<?, ?>) responseBody.get("data");
                if (dataMap != null) {
                    String quoteIdStr = (String) dataMap.get("id");
                    if (quoteIdStr != null) {
                        estimate.setQuoteId(UUID.fromString(quoteIdStr));
                        budgetEstimateRepository.save(estimate);

                        Map<String, Object> successRes = new HashMap<>();
                        successRes.put("success", true);
                        successRes.put("data", dataMap);
                        return ResponseEntity.ok(successRes);
                    }
                }
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate Quote");
        } catch (Exception e) {
            log.error("Failed to generate quote: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate quote: " + e.getMessage());
        }
    }

    private BigDecimal getPrice(UUID tenantId, PricingCategory category, String ruleKey, double fallbackPrice) {
        if (ruleKey == null || ruleKey.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return pricingRuleRepository.findByTenantIdAndCategoryAndRuleKey(tenantId, category, ruleKey)
                .map(PricingRule::getBasePrice)
                .orElse(BigDecimal.valueOf(fallbackPrice));
    }

    private double getPlateCostFallback(String type) {
        if (type == null) return 600;
        return switch (type.toUpperCase()) {
            case "WEDDING" -> 1200;
            case "CORPORATE" -> 850;
            case "ENGAGEMENT" -> 900;
            case "BIRTHDAY" -> 500;
            default -> 600;
        };
    }

    private double getVenueCostFallback(String type) {
        if (type == null) return 60000;
        return switch (type.toUpperCase()) {
            case "HOTEL" -> 100000;
            case "HALL" -> 60000;
            case "GARDEN" -> 80000;
            case "RESORT" -> 150000;
            case "BEACH" -> 120000;
            default -> 60000;
        };
    }

    private double getDecorCostFallback(String style) {
        if (style == null) return 50000;
        return switch (style.toUpperCase()) {
            case "STANDARD" -> 50000;
            case "PREMIUM" -> 150000;
            case "ROYAL" -> 350000;
            default -> 50000;
        };
    }

    private double getEffectFeeFallback(String effect) {
        if (effect == null) return 0;
        return switch (effect.toUpperCase()) {
            case "COLD_PYRO" -> 15000;
            case "DRY_ICE" -> 8000;
            case "LASER_SHOW" -> 25000;
            case "LED_WALL" -> 40000;
            default -> 0;
        };
    }

    private void seedDefaultPricingRules(UUID tenantId) {
        List<PricingRule> rules = pricingRuleRepository.findAllByTenantId(tenantId);
        if (rules.isEmpty()) {
            List<PricingRule> defaults = List.of(
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.EVENT_TYPE).ruleKey("WEDDING").basePrice(BigDecimal.valueOf(1200)).priceType(PricingType.PER_GUEST).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.EVENT_TYPE).ruleKey("CORPORATE").basePrice(BigDecimal.valueOf(850)).priceType(PricingType.PER_GUEST).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.EVENT_TYPE).ruleKey("ENGAGEMENT").basePrice(BigDecimal.valueOf(900)).priceType(PricingType.PER_GUEST).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.EVENT_TYPE).ruleKey("BIRTHDAY").basePrice(BigDecimal.valueOf(500)).priceType(PricingType.PER_GUEST).build(),

                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.VENUE_TYPE).ruleKey("HOTEL").basePrice(BigDecimal.valueOf(100000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.VENUE_TYPE).ruleKey("HALL").basePrice(BigDecimal.valueOf(60000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.VENUE_TYPE).ruleKey("GARDEN").basePrice(BigDecimal.valueOf(80000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.VENUE_TYPE).ruleKey("RESORT").basePrice(BigDecimal.valueOf(150000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.VENUE_TYPE).ruleKey("BEACH").basePrice(BigDecimal.valueOf(120000)).priceType(PricingType.FLAT_RATE).build(),

                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.DECOR_STYLE).ruleKey("STANDARD").basePrice(BigDecimal.valueOf(50000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.DECOR_STYLE).ruleKey("PREMIUM").basePrice(BigDecimal.valueOf(150000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.DECOR_STYLE).ruleKey("ROYAL").basePrice(BigDecimal.valueOf(350000)).priceType(PricingType.FLAT_RATE).build(),

                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.ADD_ON).ruleKey("COLD_PYRO").basePrice(BigDecimal.valueOf(15000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.ADD_ON).ruleKey("DRY_ICE").basePrice(BigDecimal.valueOf(8000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.ADD_ON).ruleKey("LASER_SHOW").basePrice(BigDecimal.valueOf(25000)).priceType(PricingType.FLAT_RATE).build(),
                    PricingRule.builder().tenantId(tenantId).category(PricingCategory.ADD_ON).ruleKey("LED_WALL").basePrice(BigDecimal.valueOf(40000)).priceType(PricingType.FLAT_RATE).build()
            );
            pricingRuleRepository.saveAll(defaults);
        }
    }
}
