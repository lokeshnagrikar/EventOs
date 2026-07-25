package com.eventos.event.controller;

import com.eventos.event.payment.dto.FeeConfigurationDto;
import com.eventos.event.payment.service.FeeCalculationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payment-engine")
public class PaymentEngineController {

    private final FeeCalculationService feeCalculationService;

    public PaymentEngineController(FeeCalculationService feeCalculationService) {
        this.feeCalculationService = feeCalculationService;
    }

    @PostMapping("/calculate-fee")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> calculateFeeBreakdown(
            @RequestParam(defaultValue = "50000") BigDecimal amount,
            @RequestBody(required = false) FeeConfigurationDto config) {

        Map<String, Object> breakdown = feeCalculationService.calculateBreakdown(amount, config);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", breakdown);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/providers")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getSupportedProviders() {
        Map<String, Object> providers = new HashMap<>();
        providers.put("supported", new String[]{"UPI_DIRECT", "STRIPE", "RAZORPAY", "CASHFREE", "PHONEPE"});
        providers.put("defaultProvider", "UPI_DIRECT");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", providers);

        return ResponseEntity.ok(response);
    }
}
