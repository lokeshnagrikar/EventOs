package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.*;
import com.eventos.event.entity.*;
import com.eventos.event.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Budgets", description = "Manage event budgets, category allocations, direct expense logging, and budget warning alerts")
@RestController
@RequestMapping("/bookings/{bookingId}/budget")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    private UUID getTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID tenantId = principal.getTenantId();
            if (tenantId != null) return tenantId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing");
    }

    @Operation(summary = "Get complete budget financial report")
    @GetMapping("/report")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getBudgetReport(@PathVariable UUID bookingId) {
        UUID tenantId = getTenantId();
        BudgetSummaryReportDto report = budgetService.getBudgetReport(bookingId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", report);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update overall budget limit and warning threshold")
    @PutMapping("/limit")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> updateBudgetLimit(
            @PathVariable UUID bookingId,
            @Valid @RequestBody UpdateBookingBudgetLimitDto dto) {
        UUID tenantId = getTenantId();
        BookingBudget budget = budgetService.updateBudgetLimit(bookingId, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", budget);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get budget allocations for all categories")
    @GetMapping("/allocations")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getCategoryAllocations(@PathVariable UUID bookingId) {
        UUID tenantId = getTenantId();
        List<BudgetCategoryAllocation> allocations = budgetService.getAllocations(bookingId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", allocations);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Upsert category budget allocation")
    @PutMapping("/allocations")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> saveCategoryAllocation(
            @PathVariable UUID bookingId,
            @Valid @RequestBody BudgetCategoryAllocationDto dto) {
        UUID tenantId = getTenantId();
        BudgetCategoryAllocation allocation = budgetService.saveCategoryAllocation(bookingId, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", allocation);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get list of logged expenses")
    @GetMapping("/expenses")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getExpenses(@PathVariable UUID bookingId) {
        UUID tenantId = getTenantId();
        List<Expense> expenses = budgetService.getExpenses(bookingId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", expenses);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Log new direct expense")
    @PostMapping("/expenses")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> createExpense(
            @PathVariable UUID bookingId,
            @Valid @RequestBody CreateExpenseDto dto) {
        UUID tenantId = getTenantId();
        Expense expense = budgetService.createExpense(bookingId, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", expense);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Delete expense entry")
    @DeleteMapping("/expenses/{expenseId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> deleteExpense(
            @PathVariable UUID bookingId,
            @PathVariable UUID expenseId) {
        UUID tenantId = getTenantId();
        budgetService.deleteExpense(expenseId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Expense deleted successfully");

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get active budget warning alerts")
    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getActiveAlerts(@PathVariable UUID bookingId) {
        UUID tenantId = getTenantId();
        List<BudgetAlert> alerts = budgetService.getActiveAlerts(bookingId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", alerts);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Resolve budget warning alert")
    @PostMapping("/alerts/{alertId}/resolve")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> resolveAlert(
            @PathVariable UUID bookingId,
            @PathVariable UUID alertId) {
        UUID tenantId = getTenantId();
        BudgetAlert alert = budgetService.resolveAlert(alertId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", alert);

        return ResponseEntity.ok(response);
    }
}
