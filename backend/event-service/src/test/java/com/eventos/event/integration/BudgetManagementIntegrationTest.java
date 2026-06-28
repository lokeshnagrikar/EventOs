package com.eventos.event.integration;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.*;
import com.eventos.event.entity.*;
import com.eventos.event.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("null")
public class BudgetManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private VendorContractRepository vendorContractRepository;

    @Autowired
    private TenantSequenceRepository tenantSequenceRepository;

    @MockBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    private UUID tenantId;
    private UUID otherTenantId;
    private Authentication auth;
    private Authentication otherAuth;
    private Booking bookingEntity;
    private Event eventEntity;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        otherTenantId = UUID.randomUUID();

        // Active Tenant Auth
        UserPrincipal principal = new UserPrincipal(UUID.randomUUID(), tenantId, "owner@eventos.com", "OWNER");
        auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                principal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));

        // Other Tenant Auth
        UserPrincipal otherPrincipal = new UserPrincipal(UUID.randomUUID(), otherTenantId, "otherowner@eventos.com", "OWNER");
        otherAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                otherPrincipal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));

        // Setup sequences for sequence validation
        tenantSequenceRepository.save(TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("BOOKING")
                .currentValue(0)
                .build());

        tenantSequenceRepository.save(TenantSequence.builder()
                .tenantId(otherTenantId)
                .sequenceType("BOOKING")
                .currentValue(0)
                .build());

        // Create base Event & Booking
        eventEntity = Event.builder()
                .name("Budget Planning Event")
                .type(EventType.BIRTHDAY)
                .status(EventStatus.PLANNING)
                .startDate(LocalDateTime.now().plusDays(10))
                .endDate(LocalDateTime.now().plusDays(11))
                .build();
        eventEntity.setTenantId(tenantId);
        eventEntity = eventRepository.save(eventEntity);

        bookingEntity = Booking.builder()
                .eventId(eventEntity.getId())
                .clientName("Rahul Sen")
                .clientEmail("rahul@sen.com")
                .clientPhone("9876543210")
                .bookingNumber("EVT-2005")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(BigDecimal.valueOf(10000.00))
                .paidAmount(BigDecimal.ZERO)
                .build();
        bookingEntity.setTenantId(tenantId);
        bookingEntity = bookingRepository.save(bookingEntity);
    }

    @Test
    void testUpdateBudgetLimitAndThreshold() throws Exception {
        UpdateBookingBudgetLimitDto limitDto = UpdateBookingBudgetLimitDto.builder()
                .totalBudgetLimit(BigDecimal.valueOf(5000.00))
                .alertThresholdPercentage(BigDecimal.valueOf(80.00))
                .build();

        mockMvc.perform(put("/bookings/" + bookingEntity.getId() + "/budget/limit")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(limitDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalBudgetLimit", is(5000.0)))
                .andExpect(jsonPath("$.data.alertThresholdPercentage", is(80.0)));
    }

    @Test
    void testCategoryAllocationAndAlerting() throws Exception {
        // 1. Save allocation limit of 3000.00 for VENUE
        BudgetCategoryAllocationDto allocationDto = BudgetCategoryAllocationDto.builder()
                .category(BudgetCategory.VENUE)
                .estimatedCost(BigDecimal.valueOf(3000.00))
                .build();

        mockMvc.perform(put("/bookings/" + bookingEntity.getId() + "/budget/allocations")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(allocationDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.estimatedCost", is(3000.0)))
                .andExpect(jsonPath("$.data.category", is("VENUE")));

        // 2. Log direct expense under VENUE category of 3500.00 (Exceeds VENUE allocation limit of 3000)
        CreateExpenseDto expenseDto = CreateExpenseDto.builder()
                .category(BudgetCategory.VENUE)
                .description("Palace Hall Booking Downpayment")
                .amount(BigDecimal.valueOf(3500.00))
                .paymentMethod("BANK_TRANSFER")
                .status("PAID")
                .build();

        MvcResult expenseResult = mockMvc.perform(post("/bookings/" + bookingEntity.getId() + "/budget/expenses")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expenseDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> expenseMap = objectMapper.readValue(expenseResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> expenseData = (Map<?, ?>) expenseMap.get("data");
        UUID expenseId = UUID.fromString((String) expenseData.get("id"));

        // 3. Verify category budget alert is automatically triggered
        mockMvc.perform(get("/bookings/" + bookingEntity.getId() + "/budget/alerts")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].alertType", is("CATEGORY_LIMIT_EXCEEDED")))
                .andExpect(jsonPath("$.data[0].category", is("VENUE")));

        // 4. Delete expense
        mockMvc.perform(delete("/bookings/" + bookingEntity.getId() + "/budget/expenses/" + expenseId)
                        .with(authentication(auth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 5. Verify the alert is now resolved/inactive
        mockMvc.perform(get("/bookings/" + bookingEntity.getId() + "/budget/alerts")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void testOverallBudgetAlerting() throws Exception {
        // 1. Set overall budget limit = 2000.00, threshold = 90%
        UpdateBookingBudgetLimitDto limitDto = UpdateBookingBudgetLimitDto.builder()
                .totalBudgetLimit(BigDecimal.valueOf(2000.00))
                .alertThresholdPercentage(BigDecimal.valueOf(90.00))
                .build();

        mockMvc.perform(put("/bookings/" + bookingEntity.getId() + "/budget/limit")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(limitDto)))
                .andExpect(status().isOk());

        // 2. Log direct expense under CATERING = 1850.00 (Exceeds 90% threshold of 1800.00 but within 2000.00 limit)
        CreateExpenseDto thresholdExpense = CreateExpenseDto.builder()
                .category(BudgetCategory.CATERING)
                .description("Catering deposit")
                .amount(BigDecimal.valueOf(1850.00))
                .paymentMethod("CASH")
                .status("PAID")
                .build();

        mockMvc.perform(post("/bookings/" + bookingEntity.getId() + "/budget/expenses")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(thresholdExpense)))
                .andExpect(status().isCreated());

        // 3. Verify overall threshold warning alert is triggered
        mockMvc.perform(get("/bookings/" + bookingEntity.getId() + "/budget/alerts")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].alertType", is("OVERALL_THRESHOLD_REACHED")));

        // 4. Log another direct expense under CATERING = 200.00 (making total actual 2050.00, which exceeds overall limit 2000.00)
        CreateExpenseDto limitExpense = CreateExpenseDto.builder()
                .category(BudgetCategory.CATERING)
                .description("Additional plates")
                .amount(BigDecimal.valueOf(200.00))
                .paymentMethod("UPI")
                .status("PAID")
                .build();

        mockMvc.perform(post("/bookings/" + bookingEntity.getId() + "/budget/expenses")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(limitExpense)))
                .andExpect(status().isCreated());

        // 5. Verify OVERALL_LIMIT_EXCEEDED is now active, and OVERALL_THRESHOLD_REACHED is inactive/resolved
        mockMvc.perform(get("/bookings/" + bookingEntity.getId() + "/budget/alerts")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].alertType", is("OVERALL_LIMIT_EXCEEDED")));
    }

    @Test
    void testBudgetReportAndPayouts() throws Exception {
        // 1. Create a Vendor under DECORATION category
        Vendor vendor = Vendor.builder()
                .name("Flora Decors")
                .serviceType(VendorCategory.DECORATION)
                .status("ACTIVE")
                .build();
        vendor.setTenantId(tenantId);
        vendor = vendorRepository.save(vendor);

        // 2. Create VendorContract (totalCost = 1500.00, actualCost = 1200.00, paidAmount = 500.00)
        CreateVendorContractDto contractDto = CreateVendorContractDto.builder()
                .vendorId(vendor.getId())
                .bookingId(bookingEntity.getId())
                .contractNumber("VC-TEST-BUDGET")
                .details("Stage Flowers")
                .totalCost(BigDecimal.valueOf(1500.00))
                .actualCost(BigDecimal.valueOf(1200.00))
                .status("SIGNED")
                .paidAmount(BigDecimal.valueOf(500.00))
                .build();

        mockMvc.perform(post("/vendors/contracts")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(contractDto)))
                .andExpect(status().isCreated());

        // 3. Fetch report
        mockMvc.perform(get("/bookings/" + bookingEntity.getId() + "/budget/report")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.revenue", is(10000.0)))
                .andExpect(jsonPath("$.data.totalEstimatedCost", is(1500.0))) // fallback to decoration contract totalCost
                .andExpect(jsonPath("$.data.totalActualCost", is(1200.0))) // fallback to decoration contract actualCost
                .andExpect(jsonPath("$.data.totalRemainingBudget", is(300.0))) // estimated (1500) - actual (1200) since limit is 0
                .andExpect(jsonPath("$.data.profitMargin", is(8800.0))) // revenue (10000) - actual (1200)
                .andExpect(jsonPath("$.data.profitMarginPercentage", is(88.0)))
                .andExpect(jsonPath("$.data.categoryBreakdowns", hasSize(BudgetCategory.values().length)));
    }

    @Test
    void testTenantBoundaryChecks() throws Exception {
        // 1. Attempt to retrieve active tenant's budget report under otherTenantId credentials -> should return 404
        mockMvc.perform(get("/bookings/" + bookingEntity.getId() + "/budget/report")
                        .with(authentication(otherAuth)))
                .andExpect(status().isNotFound());

        // 2. Attempt to save category allocation under otherTenantId credentials -> should return 404
        BudgetCategoryAllocationDto allocationDto = BudgetCategoryAllocationDto.builder()
                .category(BudgetCategory.PHOTOGRAPHY)
                .estimatedCost(BigDecimal.valueOf(2000.00))
                .build();

        mockMvc.perform(put("/bookings/" + bookingEntity.getId() + "/budget/allocations")
                        .with(authentication(otherAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(allocationDto)))
                .andExpect(status().isNotFound());
    }
}
