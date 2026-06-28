package com.eventos.event.integration;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.CreatePaymentDto;
import com.eventos.event.dto.CreateTimelineTaskDto;
import com.eventos.event.dto.PatchEventDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("null")
public class PaymentTrackingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private TenantSequenceRepository tenantSequenceRepository;

    @MockBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    private UUID tenantId;
    private Authentication auth;
    private Booking bookingEntity;
    private Event eventEntity;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        // Setup Tenant Auth Context
        UserPrincipal principal = new UserPrincipal(UUID.randomUUID(), tenantId, "owner@eventos.com", "OWNER");
        auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                principal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));

        // Setup sequences
        tenantSequenceRepository.save(TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("BOOKING")
                .currentValue(0)
                .build());

        tenantSequenceRepository.save(TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("INVOICE")
                .currentValue(0)
                .build());

        // Create base Event & Booking
        eventEntity = Event.builder()
                .name("Grand Celebration")
                .type(EventType.WEDDING)
                .status(EventStatus.PLANNING)
                .startDate(LocalDateTime.now().plusDays(10))
                .endDate(LocalDateTime.now().plusDays(10).plusHours(6))
                .build();
        eventEntity.setTenantId(tenantId);
        eventEntity = eventRepository.save(eventEntity);

        bookingEntity = Booking.builder()
                .eventId(eventEntity.getId())
                .clientName("Rahul Sen")
                .clientEmail("rahul@sen.com")
                .clientPhone("9876543210")
                .bookingNumber("EVT-2026-000001")
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(1000.00))
                .paidAmount(BigDecimal.ZERO)
                .build();
        bookingEntity.setTenantId(tenantId);
        bookingEntity = bookingRepository.save(bookingEntity);
    }

    @Test
    void testRecordPayment_UPI_Cash_Card_BankTransfer_Validation() throws Exception {
        // 1. Valid payment - UPI method
        CreatePaymentDto dtoUpi = CreatePaymentDto.builder()
                .bookingId(bookingEntity.getId())
                .amount(BigDecimal.valueOf(100.00))
                .paymentMethod("UPI")
                .paymentDate(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/payments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dtoUpi)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.paymentMethod", is("UPI")));

        // 2. Valid payment - Bank transfer method (case insensitive/normalized)
        CreatePaymentDto dtoBank = CreatePaymentDto.builder()
                .bookingId(bookingEntity.getId())
                .amount(BigDecimal.valueOf(200.00))
                .paymentMethod("bank_transfer")
                .paymentDate(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/payments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dtoBank)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.paymentMethod", is("Bank transfer")));

        // 3. Invalid payment - Bad method
        CreatePaymentDto dtoBad = CreatePaymentDto.builder()
                .bookingId(bookingEntity.getId())
                .amount(BigDecimal.valueOf(150.00))
                .paymentMethod("Gold Bars")
                .paymentDate(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/payments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dtoBad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.message", containsString("Invalid payment method")));
    }

    @Test
    void testOutstandingBalanceCalculation() throws Exception {
        Invoice invoice = Invoice.builder()
                .bookingId(bookingEntity.getId())
                .invoiceNumber("INV-2026-000001")
                .subtotal(BigDecimal.valueOf(1000.00))
                .tax(BigDecimal.ZERO)
                .discount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(1000.00))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDateTime.now().plusDays(5))
                .status("SENT")
                .clientName("Rahul Sen")
                .build();
        invoice.setTenantId(tenantId);
        invoice = invoiceRepository.save(invoice);

        // Verify initial outstanding balance is 1000.00
        mockMvc.perform(get("/bookings/" + bookingEntity.getId())
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outstandingBalance", is(1000.00)));

        mockMvc.perform(get("/invoices/" + invoice.getId())
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outstandingBalance", is(1000.00)));

        // Record a partial payment of 400.00
        CreatePaymentDto dto = CreatePaymentDto.builder()
                .bookingId(bookingEntity.getId())
                .invoiceId(invoice.getId())
                .amount(BigDecimal.valueOf(400.00))
                .paymentMethod("Cash")
                .paymentDate(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/payments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // Verify outstanding balance becomes 600.00
        mockMvc.perform(get("/bookings/" + bookingEntity.getId())
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outstandingBalance", is(600.00)));

        mockMvc.perform(get("/invoices/" + invoice.getId())
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outstandingBalance", is(600.00)));
    }

    @Test
    void testAutomaticBookingConfirmation_And_EventPromotion() throws Exception {
        Invoice invoice = Invoice.builder()
                .bookingId(bookingEntity.getId())
                .invoiceNumber("INV-2026-000002")
                .subtotal(BigDecimal.valueOf(1000.00))
                .tax(BigDecimal.ZERO)
                .discount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(1000.00))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDateTime.now().plusDays(5))
                .status("SENT")
                .clientName("Rahul Sen")
                .build();
        invoice.setTenantId(tenantId);
        invoice = invoiceRepository.save(invoice);

        // Record full payment of 1000.00
        CreatePaymentDto dto = CreatePaymentDto.builder()
                .bookingId(bookingEntity.getId())
                .invoiceId(invoice.getId())
                .amount(BigDecimal.valueOf(1000.00))
                .paymentMethod("Credit card")
                .paymentDate(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/payments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // Verify Invoice status becomes PAID
        mockMvc.perform(get("/invoices/" + invoice.getId())
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PAID")));

        // Verify Booking status becomes CONFIRMED
        mockMvc.perform(get("/bookings/" + bookingEntity.getId())
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")));

        // Verify Event status becomes CONFIRMED
        mockMvc.perform(get("/events/" + eventEntity.getId())
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")));
    }

    @Test
    void testRabbitMQPaymentRecordedEvent() throws Exception {
        CreatePaymentDto dto = CreatePaymentDto.builder()
                .bookingId(bookingEntity.getId())
                .amount(BigDecimal.valueOf(500.00))
                .paymentMethod("Credit card")
                .paymentDate(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/payments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // Verify rabbitTemplate published the event
        verify(rabbitTemplate, times(1)).convertAndSend(
                eq(com.eventos.event.config.MessagingConfig.EXCHANGE),
                eq(com.eventos.event.config.MessagingConfig.PAYMENT_RECORDED_ROUTING_KEY),
                any(com.eventos.event.event.PaymentRecordedEvent.class)
        );
    }

    @Test
    void testPatchEvent_PartialUpdates() throws Exception {
        PatchEventDto patchDto = PatchEventDto.builder()
                .notes("Updated Notes via PATCH")
                .guestCount(150)
                .build();

        mockMvc.perform(patch("/events/" + eventEntity.getId())
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.notes", is("Updated Notes via PATCH")))
                .andExpect(jsonPath("$.data.guestCount", is(150)))
                // Verify original fields are preserved
                .andExpect(jsonPath("$.data.name", is("Grand Celebration")))
                .andExpect(jsonPath("$.data.type", is("WEDDING")));
    }

    @Test
    void testGlobalTasksEndpoints() throws Exception {
        CreateTimelineTaskDto taskDto = CreateTimelineTaskDto.builder()
                .title("Arrange sound system")
                .description("Check mic and speaker setups")
                .dueDate(LocalDateTime.now().plusDays(2))
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .eventId(eventEntity.getId())
                .build();

        // 1. POST global task creation
        mockMvc.perform(post("/events/tasks")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Arrange sound system")))
                .andExpect(jsonPath("$.data.eventId", is(eventEntity.getId().toString())));

        // 2. GET global tasks by eventId
        mockMvc.perform(get("/events/tasks")
                        .param("eventId", eventEntity.getId().toString())
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title", is("Arrange sound system")));

        // 3. GET all global tasks for tenant
        mockMvc.perform(get("/events/tasks")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title", is("Arrange sound system")));
    }

    @Test
    void testRecordPayment_ClientRole_Authorized() throws Exception {
        UserPrincipal clientPrincipal = new UserPrincipal(UUID.randomUUID(), tenantId, "rahul@sen.com", "CLIENT");
        Authentication clientAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                clientPrincipal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_CLIENT")));

        CreatePaymentDto dto = CreatePaymentDto.builder()
                .bookingId(bookingEntity.getId())
                .amount(BigDecimal.valueOf(150.00))
                .paymentMethod("UPI")
                .paymentDate(LocalDateTime.now())
                .notes("Payment from client portal")
                .build();

        mockMvc.perform(post("/payments")
                        .with(authentication(clientAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PENDING_VERIFICATION")))
                .andExpect(jsonPath("$.data.amount", is(150.0)));
    }

    @Test
    void testRecordPayment_ClientRole_Unauthorized() throws Exception {
        UserPrincipal unauthorizedClientPrincipal = new UserPrincipal(UUID.randomUUID(), tenantId, "unauthorized@test.com", "CLIENT");
        Authentication unauthorizedClientAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                unauthorizedClientPrincipal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_CLIENT")));

        CreatePaymentDto dto = CreatePaymentDto.builder()
                .bookingId(bookingEntity.getId())
                .amount(BigDecimal.valueOf(150.00))
                .paymentMethod("UPI")
                .paymentDate(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/payments")
                        .with(authentication(unauthorizedClientAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }
}
