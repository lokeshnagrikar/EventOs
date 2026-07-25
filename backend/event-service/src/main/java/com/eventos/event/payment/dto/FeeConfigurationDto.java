package com.eventos.event.payment.dto;

import java.math.BigDecimal;

public class FeeConfigurationDto {
    private String feeType; // NO_FEE, FIXED, PERCENTAGE, CUSTOM
    private BigDecimal fixedFeeAmount;
    private BigDecimal percentageFeeRate;
    private String feeBearer; // OWNER_DEDUCTION, CLIENT_SURCHARGE
    private String currency;

    public FeeConfigurationDto() {
        this.feeType = "NO_FEE";
        this.fixedFeeAmount = BigDecimal.ZERO;
        this.percentageFeeRate = BigDecimal.ZERO;
        this.feeBearer = "OWNER_DEDUCTION";
        this.currency = "INR";
    }

    public String getFeeType() {
        return feeType;
    }

    public void setFeeType(String feeType) {
        this.feeType = feeType;
    }

    public BigDecimal getFixedFeeAmount() {
        return fixedFeeAmount;
    }

    public void setFixedFeeAmount(BigDecimal fixedFeeAmount) {
        this.fixedFeeAmount = fixedFeeAmount;
    }

    public BigDecimal getPercentageFeeRate() {
        return percentageFeeRate;
    }

    public void setPercentageFeeRate(BigDecimal percentageFeeRate) {
        this.percentageFeeRate = percentageFeeRate;
    }

    public String getFeeBearer() {
        return feeBearer;
    }

    public void setFeeBearer(String feeBearer) {
        this.feeBearer = feeBearer;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
