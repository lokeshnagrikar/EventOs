package com.eventos.auth.exception;

public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;
    private final String errorCode;

    public RateLimitExceededException(long retryAfterSeconds, String message) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
        this.errorCode = "RATE_LIMITED";
    }

    public RateLimitExceededException(long retryAfterSeconds, String errorCode, String message) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
        this.errorCode = errorCode != null ? errorCode : "RATE_LIMITED";
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
