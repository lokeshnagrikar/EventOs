package com.eventos.event.payment.service;

import com.eventos.event.payment.dto.FeeConfigurationDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
public class FeeCalculationService {

    public Map<String, Object> calculateBreakdown(BigDecimal subtotalAmount, FeeConfigurationDto config) {
        if (subtotalAmount == null) {
            subtotalAmount = BigDecimal.ZERO;
        }
        if (config == null) {
            config = new FeeConfigurationDto();
        }

        BigDecimal calculatedFee = BigDecimal.ZERO;
        String feeType = config.getFeeType() != null ? config.getFeeType() : "NO_FEE";

        if ("FIXED".equalsIgnoreCase(feeType)) {
            calculatedFee = config.getFixedFeeAmount() != null ? config.getFixedFeeAmount() : BigDecimal.ZERO;
        } else if ("PERCENTAGE".equalsIgnoreCase(feeType)) {
            BigDecimal rate = config.getPercentageFeeRate() != null ? config.getPercentageFeeRate() : BigDecimal.ZERO;
            calculatedFee = subtotalAmount.multiply(rate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }

        BigDecimal netSettlementAmount;
        BigDecimal totalClientAmount;

        if ("CLIENT_SURCHARGE".equalsIgnoreCase(config.getFeeBearer())) {
            totalClientAmount = subtotalAmount.add(calculatedFee);
            netSettlementAmount = subtotalAmount;
        } else {
            // OWNER_DEDUCTION (Default)
            totalClientAmount = subtotalAmount;
            netSettlementAmount = subtotalAmount.subtract(calculatedFee).max(BigDecimal.ZERO);
        }

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("subtotalAmount", subtotalAmount);
        breakdown.put("feeType", feeType);
        breakdown.put("calculatedFee", calculatedFee);
        breakdown.put("feeBearer", config.getFeeBearer());
        breakdown.put("netSettlementAmount", netSettlementAmount);
        breakdown.put("totalClientAmount", totalClientAmount);
        breakdown.put("currency", config.getCurrency());

        return breakdown;
    }
}
