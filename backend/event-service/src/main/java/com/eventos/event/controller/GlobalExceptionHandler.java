package com.eventos.event.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

/**
 * Centralized exception handler — returns a uniform API response shape:
 * <pre>
 * { "success": false, "error": { "code": "...", "message": "..." } }
 * </pre>
 */
@RestControllerAdvice
@SuppressWarnings("null")
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ─── Validation errors (@Valid / @Validated) ───────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Validation failed");
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
    }

    // ─── Business-rule violations ──────────────────────────────────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage());
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        return error(HttpStatus.CONFLICT, "CONFLICT_ERROR", "A database conflict occurred: unique constraint violation or duplicate entry");
    }

    // ─── RBAC / authorization failures ────────────────────────────────────────

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Insufficient permissions to perform this action");
    }

    // ─── Explicit HTTP status exceptions ──────────────────────────────────────

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException ex) {
        return error(HttpStatus.valueOf(ex.getStatusCode().value()), "REQUEST_ERROR", ex.getReason());
    }

    // ─── Resource not found ────────────────────────────────────────────────────

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNotFound(NoResourceFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found");
    }

    // ─── Catch-all ─────────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneral(Exception ex) {
        log.error("Unhandled exception in event-service", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred");
    }

    // ─── Response builder ──────────────────────────────────────────────────────

    private ResponseEntity<?> error(HttpStatus status, String code, String message) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("code", code);
        errorDetails.put("message", message);

        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("error", errorDetails);

        return ResponseEntity.status(status).body(body);
    }
}
