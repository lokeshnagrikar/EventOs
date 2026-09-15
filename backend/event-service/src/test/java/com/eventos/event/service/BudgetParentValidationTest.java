package com.eventos.event.service;

import com.eventos.event.entity.*;
import com.eventos.event.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class BudgetParentValidationTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingBudgetRepository bookingBudgetRepository;

    @Mock
    private BudgetCategoryAllocationRepository budgetCategoryAllocationRepository;

    @Mock
    private BudgetAlertRepository budgetAlertRepository;

    @Mock
    private VendorContractRepository vendorContractRepository;

    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private BudgetService budgetService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID bookingA = UUID.randomUUID();
    private final UUID bookingB = UUID.randomUUID();
    private final UUID expenseId = UUID.randomUUID();

    private Expense expenseForBookingA;
    private Booking mockBooking;
    private BookingBudget mockBudget;

    @BeforeEach
    void setUp() {
        mockBooking = Booking.builder()
                .bookingNumber("EVT-2026-000001")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(BigDecimal.valueOf(500000))
                .paidAmount(BigDecimal.ZERO)
                .build();
        mockBooking.setId(bookingA);
        mockBooking.setTenantId(tenantId);

        mockBudget = BookingBudget.builder()
                .bookingId(bookingA)
                .totalBudgetLimit(BigDecimal.valueOf(400000))
                .alertThresholdPercentage(BigDecimal.valueOf(80))
                .build();
        mockBudget.setTenantId(tenantId);

        expenseForBookingA = Expense.builder()
                .bookingId(bookingA)
                .category(BudgetCategory.VENUE)
                .description("Venue Deposit")
                .amount(new BigDecimal("5000.00"))
                .expenseDate(java.time.LocalDateTime.now())
                .paymentMethod("UPI")
                .status("PAID")
                .build();
        expenseForBookingA.setId(expenseId);
        expenseForBookingA.setTenantId(tenantId);
    }

    @Test
    @DisplayName("SEC-2M-05: Deleting expense from the correct parent booking succeeds")
    void testDeleteExpense_CorrectBooking_Succeeds() {
        when(expenseRepository.findByIdAndTenantId(expenseId, tenantId))
                .thenReturn(Optional.of(expenseForBookingA));
        when(bookingRepository.findByIdAndTenantId(bookingA, tenantId))
                .thenReturn(Optional.of(mockBooking));
        when(bookingBudgetRepository.findByBookingIdAndTenantId(bookingA, tenantId))
                .thenReturn(Optional.of(mockBudget));
        when(vendorContractRepository.findAllByBookingIdAndTenantId(bookingA, tenantId))
                .thenReturn(java.util.Collections.emptyList());
        when(expenseRepository.findAllByBookingIdAndTenantIdOrderByExpenseDateDesc(bookingA, tenantId))
                .thenReturn(java.util.Collections.emptyList());
        when(budgetCategoryAllocationRepository.findAllByBookingIdAndTenantId(bookingA, tenantId))
                .thenReturn(java.util.Collections.emptyList());
        when(vendorRepository.findAllByTenantId(tenantId))
                .thenReturn(java.util.Collections.emptyList());
        when(budgetAlertRepository.findAllByBookingIdAndTenantIdAndResolvedFalse(bookingA, tenantId))
                .thenReturn(java.util.Collections.emptyList());

        budgetService.deleteExpense(bookingA, expenseId, tenantId);

        verify(expenseRepository, times(1)).delete(expenseForBookingA);
    }

    @Test
    @DisplayName("SEC-2M-05: Intra-tenant parent mismatch — Deleting expense from wrong booking within same tenant is rejected")
    void testDeleteExpense_WrongBooking_WithinSameTenant_Rejected() {
        when(expenseRepository.findByIdAndTenantId(expenseId, tenantId))
                .thenReturn(Optional.of(expenseForBookingA));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                budgetService.deleteExpense(bookingB, expenseId, tenantId));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals("Expense does not belong to the requested booking", ex.getReason());
        verify(expenseRepository, never()).delete(any());
    }

    @Test
    @DisplayName("SEC-2M-05: Cross-tenant expense deletion is rejected with 404")
    void testDeleteExpense_CrossTenant_Rejected() {
        UUID otherTenantId = UUID.randomUUID();
        when(expenseRepository.findByIdAndTenantId(expenseId, otherTenantId))
                .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                budgetService.deleteExpense(bookingA, expenseId, otherTenantId));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(expenseRepository, never()).delete(any());
    }
}
