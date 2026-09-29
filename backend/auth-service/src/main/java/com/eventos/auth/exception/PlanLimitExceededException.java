package com.eventos.auth.exception;

public class PlanLimitExceededException extends RuntimeException {

    private final String limitName;
    private final String limitValue;
    private final String currentValue;

    public PlanLimitExceededException(String message) {
        super(message);
        this.limitName = "Quota Limit";
        this.limitValue = "Max";
        this.currentValue = "Current";
    }

    public PlanLimitExceededException(String message, String limitName, String limitValue, String currentValue) {
        super(message);
        this.limitName = limitName;
        this.limitValue = limitValue;
        this.currentValue = currentValue;
    }

    public String getLimitName() {
        return limitName;
    }

    public String getLimitValue() {
        return limitValue;
    }

    public String getCurrentValue() {
        return currentValue;
    }
}
