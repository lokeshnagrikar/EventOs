package com.eventos.event.controller;

import com.eventos.event.entity.TaxSettings;
import com.eventos.event.repository.TaxSettingsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings/tax")
public class TaxController {

    private final TaxSettingsRepository taxSettingsRepository;

    public TaxController(TaxSettingsRepository taxSettingsRepository) {
        this.taxSettingsRepository = taxSettingsRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getTaxSettings(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        TaxSettings settings = taxSettingsRepository.findById(tenantId)
                .orElseGet(() -> {
                    TaxSettings defaultSettings = TaxSettings.builder()
                            .tenantId(tenantId)
                            .gstRate(new BigDecimal("18.00"))
                            .vatRate(BigDecimal.ZERO)
                            .invoiceFormat("INV-{{year}}-{{seq}}")
                            .paymentTermsDays(15)
                            .lateFeePercentage(new BigDecimal("2.00"))
                            .automaticCalculation(true)
                            .build();
                    return taxSettingsRepository.save(defaultSettings);
                });

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", settings);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Transactional
    public ResponseEntity<?> updateTaxSettings(
            @RequestBody TaxSettings details,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        TaxSettings settings = taxSettingsRepository.findById(tenantId)
                .orElseGet(() -> {
                    details.setTenantId(tenantId);
                    return details;
                });

        if (details.getGstRate() != null) settings.setGstRate(details.getGstRate());
        if (details.getVatRate() != null) settings.setVatRate(details.getVatRate());
        if (details.getInvoiceFormat() != null) settings.setInvoiceFormat(details.getInvoiceFormat());
        if (details.getPaymentTermsDays() > 0) settings.setPaymentTermsDays(details.getPaymentTermsDays());
        if (details.getLateFeePercentage() != null) settings.setLateFeePercentage(details.getLateFeePercentage());
        settings.setAutomaticCalculation(details.isAutomaticCalculation());

        TaxSettings saved = taxSettingsRepository.save(settings);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    private UUID getTenantId(String header) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.event.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.event.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        if (header != null && !header.isEmpty()) {
            return UUID.fromString(header);
        }
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Tenant ID context is missing");
    }
}
