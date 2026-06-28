package com.eventos.event.service;

import com.eventos.event.dto.BudgetCategoryAllocationDto;
import com.eventos.event.dto.CreateExpenseDto;
import com.eventos.event.dto.UpdateBookingBudgetLimitDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings("null")
public class BudgetServiceTest {

    @Mock
    private BookingBudgetRepository bookingBudgetRepository;

    @Mock
    private BudgetCategoryAllocationRepository budgetCategoryAllocationRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private BudgetAlertRepository budgetAlertRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private VendorContractRepository vendorContractRepository;

    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private BudgetService budgetService;

    private UUID tenantId;
    private UUID bookingId;
    private Booking mockBooking;
    private BookingBudget mockBudget;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        bookingId = UUID.randomUUID();

        mockBooking = Booking.builder()
                .bookingNumber("EVT-2026-000001")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(BigDecimal.valueOf(500000))
                .paidAmount(BigDecimal.ZERO)
                .build();
        mockBooking.setTenantId(tenantId);

        mockBudget = BookingBudget.builder()
                .bookingId(bookingId)
                .totalBudgetLimit(BigDecimal.valueOf(400000))
                .alertThresholdPercentage(BigDecimal.valueOf(80))
                .build();
        mockBudget.setTenantId(tenantId);
    }

    @Test
    void testUpdateBudgetLimit_Success() {
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBooking));
        when(bookingBudgetRepository.findByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBudget));
        when(bookingBudgetRepository.save(any(BookingBudget.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        // For recalculateAndCheckAlerts: return empty lists
        when(vendorContractRepository.findAllByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(expenseRepository.findAllByBookingIdAndTenantIdOrderByExpenseDateDesc(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(budgetCategoryAllocationRepository.findAllByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(vendorRepository.findAllByTenantId(tenantId))
                .thenReturn(Collections.emptyList());
        when(budgetAlertRepository.findAllByBookingIdAndTenantIdAndResolvedFalse(bookingId, tenantId))
                .thenReturn(Collections.emptyList());

        UpdateBookingBudgetLimitDto dto = UpdateBookingBudgetLimitDto.builder()
                .totalBudgetLimit(BigDecimal.valueOf(300000))
                .alertThresholdPercentage(BigDecimal.valueOf(75))
                .build();

        BookingBudget result = budgetService.updateBudgetLimit(bookingId, dto, tenantId);

        assertNotNull(result);
        assertEquals(0, result.getTotalBudgetLimit().compareTo(BigDecimal.valueOf(300000)));
        assertEquals(0, result.getAlertThresholdPercentage().compareTo(BigDecimal.valueOf(75)));
        verify(bookingBudgetRepository, atLeastOnce()).save(any(BookingBudget.class));
    }

    @Test
    void testUpdateBudgetLimit_BookingNotFound_ThrowsException() {
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.empty());

        UpdateBookingBudgetLimitDto dto = UpdateBookingBudgetLimitDto.builder()
                .totalBudgetLimit(BigDecimal.valueOf(100000))
                .alertThresholdPercentage(BigDecimal.valueOf(80))
                .build();

        assertThrows(ResponseStatusException.class, () ->
                budgetService.updateBudgetLimit(bookingId, dto, tenantId));

        verify(bookingBudgetRepository, never()).save(any());
    }

    @Test
    void testSaveCategoryAllocation_Success() {
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBooking));
        when(budgetCategoryAllocationRepository.findByBookingIdAndCategoryAndTenantId(
                bookingId, BudgetCategory.VENUE, tenantId))
                .thenReturn(Optional.empty());
        when(budgetCategoryAllocationRepository.save(any(BudgetCategoryAllocation.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(bookingBudgetRepository.findByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.empty()); // triggers getOrInit to return null quickly
        when(vendorContractRepository.findAllByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(expenseRepository.findAllByBookingIdAndTenantIdOrderByExpenseDateDesc(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(budgetCategoryAllocationRepository.findAllByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(vendorRepository.findAllByTenantId(tenantId))
                .thenReturn(Collections.emptyList());
        when(budgetAlertRepository.findAllByBookingIdAndTenantIdAndResolvedFalse(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(bookingBudgetRepository.save(any(BookingBudget.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        BudgetCategoryAllocationDto dto = BudgetCategoryAllocationDto.builder()
                .category(BudgetCategory.VENUE)
                .estimatedCost(BigDecimal.valueOf(150000))
                .build();

        BudgetCategoryAllocation result = budgetService.saveCategoryAllocation(bookingId, dto, tenantId);

        assertNotNull(result);
        assertEquals(BudgetCategory.VENUE, result.getCategory());
        assertEquals(0, result.getEstimatedCost().compareTo(BigDecimal.valueOf(150000)));
    }

    @Test
    void testCreateExpense_Success() {
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBooking));
        when(expenseRepository.save(any(Expense.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(bookingBudgetRepository.findByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.empty());
        when(bookingBudgetRepository.save(any(BookingBudget.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(vendorContractRepository.findAllByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(expenseRepository.findAllByBookingIdAndTenantIdOrderByExpenseDateDesc(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(budgetCategoryAllocationRepository.findAllByBookingIdAndTenantId(bookingId, tenantId))
                .thenReturn(Collections.emptyList());
        when(vendorRepository.findAllByTenantId(tenantId))
                .thenReturn(Collections.emptyList());
        when(budgetAlertRepository.findAllByBookingIdAndTenantIdAndResolvedFalse(bookingId, tenantId))
                .thenReturn(Collections.emptyList());

        CreateExpenseDto dto = CreateExpenseDto.builder()
                .category(BudgetCategory.CATERING)
                .description("Catering advance payment")
                .amount(BigDecimal.valueOf(50000))
                .status("PAID")
                .build();

        Expense result = budgetService.createExpense(bookingId, dto, tenantId);

        assertNotNull(result);
        assertEquals(BudgetCategory.CATERING, result.getCategory());
        assertEquals(0, result.getAmount().compareTo(BigDecimal.valueOf(50000)));
        assertEquals("PAID", result.getStatus());
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    void testResolveAlert_Success() {
        UUID alertId = UUID.randomUUID();
        BudgetAlert alert = BudgetAlert.builder()
                .bookingId(bookingId)
                .alertType(AlertType.OVERALL_THRESHOLD_REACHED)
                .message("Threshold exceeded")
                .resolved(false)
                .build();
        alert.setTenantId(tenantId);

        when(budgetAlertRepository.findByIdAndTenantId(alertId, tenantId))
                .thenReturn(Optional.of(alert));
        when(budgetAlertRepository.save(any(BudgetAlert.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        BudgetAlert result = budgetService.resolveAlert(alertId, tenantId);

        assertNotNull(result);
        assertTrue(result.isResolved());
        verify(budgetAlertRepository, times(1)).save(any(BudgetAlert.class));
    }

    @Test
    void testResolveAlert_NotFound_ThrowsException() {
        UUID alertId = UUID.randomUUID();
        when(budgetAlertRepository.findByIdAndTenantId(alertId, tenantId))
                .thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                budgetService.resolveAlert(alertId, tenantId));

        verify(budgetAlertRepository, never()).save(any());
    }

    @Test
    void testGetBudgetReport_TenantIsolation() {
        UUID otherTenantId = UUID.randomUUID();
        when(bookingRepository.findByIdAndTenantId(bookingId, otherTenantId))
                .thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                budgetService.getBudgetReport(bookingId, otherTenantId));
    }
}
