package com.eventos.event.service;

import com.eventos.event.dto.*;
import com.eventos.event.entity.*;
import com.eventos.event.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@SuppressWarnings("null")
public class BudgetService {

    private final BookingBudgetRepository bookingBudgetRepository;
    private final BudgetCategoryAllocationRepository budgetCategoryAllocationRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetAlertRepository budgetAlertRepository;
    private final BookingRepository bookingRepository;
    private final VendorContractRepository vendorContractRepository;
    private final VendorRepository vendorRepository;

    public BudgetService(BookingBudgetRepository bookingBudgetRepository,
                         BudgetCategoryAllocationRepository budgetCategoryAllocationRepository,
                         ExpenseRepository expenseRepository,
                         BudgetAlertRepository budgetAlertRepository,
                         BookingRepository bookingRepository,
                         VendorContractRepository vendorContractRepository,
                         VendorRepository vendorRepository) {
        this.bookingBudgetRepository = bookingBudgetRepository;
        this.budgetCategoryAllocationRepository = budgetCategoryAllocationRepository;
        this.expenseRepository = expenseRepository;
        this.budgetAlertRepository = budgetAlertRepository;
        this.bookingRepository = bookingRepository;
        this.vendorContractRepository = vendorContractRepository;
        this.vendorRepository = vendorRepository;
    }

    // Get or initialize overall budget limit
    private BookingBudget getOrInitBudget(UUID bookingId, UUID tenantId) {
        return bookingBudgetRepository.findByBookingIdAndTenantId(bookingId, tenantId)
                .orElseGet(() -> {
                    BookingBudget budget = BookingBudget.builder()
                            .bookingId(bookingId)
                            .totalBudgetLimit(BigDecimal.ZERO)
                            .alertThresholdPercentage(BigDecimal.valueOf(90.00))
                            .build();
                    budget.setTenantId(tenantId);
                    return bookingBudgetRepository.save(budget);
                });
    }

    // ─── Limit operations ───
    public BookingBudget updateBudgetLimit(UUID bookingId, UpdateBookingBudgetLimitDto dto, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));

        BookingBudget budget = getOrInitBudget(bookingId, tenantId);
        budget.setTotalBudgetLimit(dto.getTotalBudgetLimit());
        budget.setAlertThresholdPercentage(dto.getAlertThresholdPercentage());
        BookingBudget saved = bookingBudgetRepository.save(budget);

        recalculateAndCheckAlerts(bookingId, tenantId);
        return saved;
    }

    // ─── Allocations operations ───
    public List<BudgetCategoryAllocation> getAllocations(UUID bookingId, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));
        return budgetCategoryAllocationRepository.findAllByBookingIdAndTenantId(bookingId, tenantId);
    }

    public BudgetCategoryAllocation saveCategoryAllocation(UUID bookingId, BudgetCategoryAllocationDto dto, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));

        BudgetCategoryAllocation allocation = budgetCategoryAllocationRepository
                .findByBookingIdAndCategoryAndTenantId(bookingId, dto.getCategory(), tenantId)
                .orElseGet(() -> {
                    BudgetCategoryAllocation newAlloc = BudgetCategoryAllocation.builder()
                            .bookingId(bookingId)
                            .category(dto.getCategory())
                            .build();
                    newAlloc.setTenantId(tenantId);
                    return newAlloc;
                });

        allocation.setEstimatedCost(dto.getEstimatedCost());
        BudgetCategoryAllocation saved = budgetCategoryAllocationRepository.save(allocation);

        recalculateAndCheckAlerts(bookingId, tenantId);
        return saved;
    }

    // ─── Expense Operations ───
    public List<Expense> getExpenses(UUID bookingId, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));
        return expenseRepository.findAllByBookingIdAndTenantIdOrderByExpenseDateDesc(bookingId, tenantId);
    }

    public Expense createExpense(UUID bookingId, CreateExpenseDto dto, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));

        LocalDateTime date = dto.getExpenseDate() != null ? dto.getExpenseDate() : LocalDateTime.now();

        Expense expense = Expense.builder()
                .bookingId(bookingId)
                .category(dto.getCategory())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .expenseDate(date)
                .vendorContractId(dto.getVendorContractId())
                .paymentMethod(dto.getPaymentMethod())
                .status(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "PAID")
                .build();
        expense.setTenantId(tenantId);

        Expense saved = expenseRepository.save(expense);
        recalculateAndCheckAlerts(bookingId, tenantId);
        return saved;
    }

    public void deleteExpense(UUID expenseId, UUID tenantId) {
        Expense expense = expenseRepository.findByIdAndTenantId(expenseId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found or access denied"));
        expenseRepository.delete(expense);
        recalculateAndCheckAlerts(expense.getBookingId(), tenantId);
    }

    // ─── Alerts operations ───
    public List<BudgetAlert> getActiveAlerts(UUID bookingId, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));
        return budgetAlertRepository.findAllByBookingIdAndTenantIdAndResolvedFalse(bookingId, tenantId);
    }

    public BudgetAlert resolveAlert(UUID alertId, UUID tenantId) {
        BudgetAlert alert = budgetAlertRepository.findByIdAndTenantId(alertId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found or access denied"));
        alert.setResolved(true);
        return budgetAlertRepository.save(alert);
    }

    // ─── Reports and calculations ───
    public BudgetSummaryReportDto getBudgetReport(UUID bookingId, UUID tenantId) {
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found or access denied"));

        BookingBudget budget = getOrInitBudget(bookingId, tenantId);
        List<BudgetCategoryAllocation> allocations = budgetCategoryAllocationRepository.findAllByBookingIdAndTenantId(bookingId, tenantId);
        List<VendorContract> contracts = vendorContractRepository.findAllByBookingIdAndTenantId(bookingId, tenantId);
        List<Expense> expenses = expenseRepository.findAllByBookingIdAndTenantIdOrderByExpenseDateDesc(bookingId, tenantId);

        // Preload vendors to map contract category
        Map<UUID, Vendor> vendorMap = vendorRepository.findAllByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Vendor::getId, v -> v, (v1, v2) -> v1));

        Map<BudgetCategory, List<VendorContract>> contractsByCategory = new EnumMap<>(BudgetCategory.class);
        for (VendorContract contract : contracts) {
            if ("CANCELLED".equals(contract.getStatus())) {
                continue;
            }
            Vendor vendor = vendorMap.get(contract.getVendorId());
            BudgetCategory cat = mapVendorCategoryToBudget(vendor != null ? vendor.getServiceType() : null);
            contractsByCategory.computeIfAbsent(cat, k -> new ArrayList<>()).add(contract);
        }

        Map<BudgetCategory, List<Expense>> expensesByCategory = expenses.stream()
                .collect(Collectors.groupingBy(Expense::getCategory));

        Map<BudgetCategory, BudgetCategoryAllocation> allocationsByCategory = allocations.stream()
                .collect(Collectors.toMap(BudgetCategoryAllocation::getCategory, a -> a, (a1, a2) -> a1));

        List<BudgetSummaryReportDto.CategoryBreakdown> breakdowns = new ArrayList<>();
        BigDecimal totalEstimatedCost = BigDecimal.ZERO;
        BigDecimal totalActualCost = BigDecimal.ZERO;

        for (BudgetCategory cat : BudgetCategory.values()) {
            BudgetCategoryAllocation alloc = allocationsByCategory.get(cat);
            BigDecimal allocationLimit = alloc != null ? alloc.getEstimatedCost() : BigDecimal.ZERO;

            List<VendorContract> catContracts = contractsByCategory.getOrDefault(cat, Collections.emptyList());
            BigDecimal contractEstimatedCost = BigDecimal.ZERO;
            BigDecimal contractActualCost = BigDecimal.ZERO;
            BigDecimal contractPayouts = BigDecimal.ZERO;

            for (VendorContract contract : catContracts) {
                contractEstimatedCost = contractEstimatedCost.add(contract.getTotalCost() != null ? contract.getTotalCost() : BigDecimal.ZERO);
                contractActualCost = contractActualCost.add(contract.getActualCost() != null ? contract.getActualCost() : BigDecimal.ZERO);
                contractPayouts = contractPayouts.add(contract.getPaidAmount() != null ? contract.getPaidAmount() : BigDecimal.ZERO);
            }

            List<Expense> catExpenses = expensesByCategory.getOrDefault(cat, Collections.emptyList());
            BigDecimal directExpensesCost = BigDecimal.ZERO;
            BigDecimal directExpensesPaid = BigDecimal.ZERO;

            for (Expense exp : catExpenses) {
                if (exp.getVendorContractId() == null) {
                    directExpensesCost = directExpensesCost.add(exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO);
                    if ("PAID".equals(exp.getStatus())) {
                        directExpensesPaid = directExpensesPaid.add(exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO);
                    }
                }
            }

            BigDecimal catEstimated = allocationLimit.compareTo(BigDecimal.ZERO) > 0 ? allocationLimit : contractEstimatedCost;
            BigDecimal catActual = contractActualCost.add(directExpensesCost);
            BigDecimal catRemaining = catEstimated.subtract(catActual);
            BigDecimal catPayoutsTotal = contractPayouts.add(directExpensesPaid);

            breakdowns.add(BudgetSummaryReportDto.CategoryBreakdown.builder()
                    .category(cat)
                    .allocationLimit(allocationLimit)
                    .contractEstimatedCost(contractEstimatedCost)
                    .contractActualCost(contractActualCost)
                    .directExpensesCost(directExpensesCost)
                    .totalEstimatedCost(catEstimated)
                    .totalActualCost(catActual)
                    .remainingBudget(catRemaining)
                    .vendorPayouts(catPayoutsTotal)
                    .build());

            totalEstimatedCost = totalEstimatedCost.add(catEstimated);
            totalActualCost = totalActualCost.add(catActual);
        }

        BigDecimal revenue = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal totalBudgetLimit = budget.getTotalBudgetLimit() != null ? budget.getTotalBudgetLimit() : BigDecimal.ZERO;
        BigDecimal remainingBudget = totalBudgetLimit.compareTo(BigDecimal.ZERO) > 0
                ? totalBudgetLimit.subtract(totalActualCost)
                : totalEstimatedCost.subtract(totalActualCost);

        BigDecimal profitMargin = revenue.subtract(totalActualCost);
        BigDecimal profitMarginPercentage = BigDecimal.ZERO;
        if (revenue.compareTo(BigDecimal.ZERO) > 0) {
            profitMarginPercentage = profitMargin.divide(revenue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        List<BudgetAlert> activeAlerts = budgetAlertRepository.findAllByBookingIdAndTenantIdAndResolvedFalse(bookingId, tenantId);

        return BudgetSummaryReportDto.builder()
                .revenue(revenue)
                .totalBudgetLimit(totalBudgetLimit)
                .alertThresholdPercentage(budget.getAlertThresholdPercentage())
                .totalEstimatedCost(totalEstimatedCost)
                .totalActualCost(totalActualCost)
                .totalRemainingBudget(remainingBudget)
                .profitMargin(profitMargin)
                .profitMarginPercentage(profitMarginPercentage)
                .categoryBreakdowns(breakdowns)
                .activeAlerts(activeAlerts)
                .build();
    }

    public void recalculateAndCheckAlerts(UUID bookingId, UUID tenantId) {
        BookingBudget budget = getOrInitBudget(bookingId, tenantId);

        BudgetSummaryReportDto report = getBudgetReport(bookingId, tenantId);

        BigDecimal totalActual = report.getTotalActualCost();
        BigDecimal limit = budget.getTotalBudgetLimit();
        BigDecimal threshold = budget.getAlertThresholdPercentage();

        // 1. Overall Limit Alert checks
        if (limit != null && limit.compareTo(BigDecimal.ZERO) > 0) {
            if (totalActual.compareTo(limit) > 0) {
                triggerAlert(bookingId, null, AlertType.OVERALL_LIMIT_EXCEEDED,
                        String.format("Overall actual cost ($%s) has exceeded the budget limit ($%s)", totalActual, limit), tenantId);
                resolveAlert(bookingId, null, AlertType.OVERALL_THRESHOLD_REACHED, tenantId);
            } else {
                BigDecimal thresholdLimit = limit.multiply(threshold).divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
                if (totalActual.compareTo(thresholdLimit) > 0) {
                    triggerAlert(bookingId, null, AlertType.OVERALL_THRESHOLD_REACHED,
                            String.format("Overall actual cost ($%s) has exceeded the threshold of %s%% of the budget limit ($%s)", totalActual, threshold, limit), tenantId);
                    resolveAlert(bookingId, null, AlertType.OVERALL_LIMIT_EXCEEDED, tenantId);
                } else {
                    resolveAlert(bookingId, null, AlertType.OVERALL_LIMIT_EXCEEDED, tenantId);
                    resolveAlert(bookingId, null, AlertType.OVERALL_THRESHOLD_REACHED, tenantId);
                }
            }
        } else {
            resolveAlert(bookingId, null, AlertType.OVERALL_LIMIT_EXCEEDED, tenantId);
            resolveAlert(bookingId, null, AlertType.OVERALL_THRESHOLD_REACHED, tenantId);
        }

        // 2. Category Limit Alert checks
        for (BudgetSummaryReportDto.CategoryBreakdown breakdown : report.getCategoryBreakdowns()) {
            BigDecimal catActual = breakdown.getTotalActualCost();
            BigDecimal catLimit = breakdown.getAllocationLimit();

            if (catLimit.compareTo(BigDecimal.ZERO) > 0 && catActual.compareTo(catLimit) > 0) {
                triggerAlert(bookingId, breakdown.getCategory(), AlertType.CATEGORY_LIMIT_EXCEEDED,
                        String.format("Actual cost for category %s ($%s) has exceeded the allocation limit ($%s)", breakdown.getCategory(), catActual, catLimit), tenantId);
            } else {
                resolveAlert(bookingId, breakdown.getCategory(), AlertType.CATEGORY_LIMIT_EXCEEDED, tenantId);
            }
        }
    }

    private void triggerAlert(UUID bookingId, BudgetCategory category, AlertType alertType, String message, UUID tenantId) {
        BudgetAlert alert;
        if (category == null) {
            alert = budgetAlertRepository.findByBookingIdAndCategoryIsNullAndAlertTypeAndTenantId(bookingId, alertType, tenantId)
                    .orElse(null);
        } else {
            alert = budgetAlertRepository.findByBookingIdAndCategoryAndAlertTypeAndTenantId(bookingId, category, alertType, tenantId)
                    .orElse(null);
        }

        if (alert == null) {
            alert = BudgetAlert.builder()
                    .bookingId(bookingId)
                    .category(category)
                    .alertType(alertType)
                    .message(message)
                    .resolved(false)
                    .build();
            alert.setTenantId(tenantId);
        } else {
            alert.setResolved(false);
            alert.setMessage(message);
        }
        budgetAlertRepository.save(alert);
    }

    private void resolveAlert(UUID bookingId, BudgetCategory category, AlertType alertType, UUID tenantId) {
        BudgetAlert alert;
        if (category == null) {
            alert = budgetAlertRepository.findByBookingIdAndCategoryIsNullAndAlertTypeAndTenantId(bookingId, alertType, tenantId)
                    .orElse(null);
        } else {
            alert = budgetAlertRepository.findByBookingIdAndCategoryAndAlertTypeAndTenantId(bookingId, category, alertType, tenantId)
                    .orElse(null);
        }

        if (alert != null && !alert.isResolved()) {
            alert.setResolved(true);
            budgetAlertRepository.save(alert);
        }
    }

    private BudgetCategory mapVendorCategoryToBudget(VendorCategory vendorCategory) {
        if (vendorCategory == null) {
            return BudgetCategory.MISCELLANEOUS;
        }
        switch (vendorCategory) {
            case VENUE:
                return BudgetCategory.VENUE;
            case CATERING:
                return BudgetCategory.CATERING;
            case PHOTOGRAPHY:
                return BudgetCategory.PHOTOGRAPHY;
            case DECORATION:
                return BudgetCategory.DECORATION;
            case TRANSPORT:
                return BudgetCategory.TRANSPORT;
            default:
                return BudgetCategory.MISCELLANEOUS;
        }
    }
}
