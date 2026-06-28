package com.eventos.event.integration;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.consumer.QuoteAcceptedConsumer;
import com.eventos.event.dto.*;
import com.eventos.event.entity.*;
import com.eventos.event.event.QuoteAcceptedEvent;
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
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("null")
public class EventIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private QuoteAcceptedConsumer quoteAcceptedConsumer;

        @Autowired
        private BookingRepository bookingRepository;

        @Autowired
        private EventRepository eventRepository;

        @Autowired
        private InvoiceRepository invoiceRepository;

        @Autowired
        private TenantSequenceRepository tenantSequenceRepository;

        @MockBean
        private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

        private UUID tenantId;
        private Authentication auth;

        @BeforeEach
        void setUp() {
                tenantId = UUID.randomUUID();

                // Setup User Principal & Auth context for OWNER role
                UserPrincipal principal = new UserPrincipal(UUID.randomUUID(), tenantId, "owner@eventos.com", "OWNER");
                auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                principal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

                // Pre-initialize sequence values to prevent constraints/null failures
                tenantSequenceRepository.saveAndFlush(TenantSequence.builder()
                                .tenantId(tenantId)
                                .sequenceType("BOOKING")
                                .currentValue(0)
                                .build());

                tenantSequenceRepository.saveAndFlush(TenantSequence.builder()
                                .tenantId(tenantId)
                                .sequenceType("INVOICE")
                                .currentValue(0)
                                .build());
        }

        @Test
        void testCompleteEventBookingPaymentVendorAndBudgetWorkflow() throws Exception {
                UUID quoteId = UUID.randomUUID();
                UUID leadId = UUID.randomUUID();

                // ─── Step 1: Fire & Consume QuoteAcceptedEvent ───
                QuoteAcceptedEvent event = QuoteAcceptedEvent.builder()
                                .quoteId(quoteId)
                                .tenantId(tenantId)
                                .leadId(leadId)
                                .quoteNumber("QT-8891")
                                .totalAmount(BigDecimal.valueOf(600000.00))
                                .contractUrl("http://s3.amazonaws.com/contracts/qt-8891.pdf")
                                .clientName("Ananya Sen")
                                .clientEmail("ananya@sen.com")
                                .clientPhone("9812345678")
                                .eventName("Ananya Wedding Reception")
                                .eventType("WEDDING")
                                .eventDate("2026-10-15")
                                .build();

                quoteAcceptedConsumer.consume(event);

                // Verify Auto-booking
                Booking booking = bookingRepository.findByQuoteIdAndTenantId(quoteId, tenantId)
                                .orElseThrow(() -> new AssertionError("Booking not created after QuoteAcceptedEvent"));

                assertEquals(0, booking.getTotalAmount().compareTo(BigDecimal.valueOf(600000.00)));
                assertEquals(BookingStatus.PENDING, booking.getStatus());
                assertTrue(booking.getBookingNumber().startsWith("EVT-"));
                assertNotNull(booking.getEventId());

                // Verify BookingCreatedEvent was published to RabbitMQ
                verify(rabbitTemplate, times(1)).convertAndSend(
                                eq("eventos.exchange"),
                                eq("booking.created"),
                                any(com.eventos.event.event.BookingCreatedEvent.class));

                // Verify duplicate booking prevention
                long bookingCountBefore = bookingRepository.count();
                quoteAcceptedConsumer.consume(event);
                long bookingCountAfter = bookingRepository.count();
                assertEquals(bookingCountBefore, bookingCountAfter, "Should not create a duplicate booking");

                // Verify Auto-event
                Event eventEntity = eventRepository.findByIdAndTenantId(booking.getEventId(), tenantId)
                                .orElseThrow(() -> new AssertionError("Event not linked/created"));

                assertEquals(EventStatus.PLANNING, eventEntity.getStatus());
                assertEquals("Ananya Sen", eventEntity.getName());

                // Verify Auto-invoice
                List<Invoice> invoices = invoiceRepository
                                .findAllByBookingIdAndTenantIdOrderByCreatedAtDesc(booking.getId(), tenantId);
                assertFalse(invoices.isEmpty(), "Invoice should be created");
                Invoice invoice = invoices.get(0);
                assertEquals(0, invoice.getTotalAmount().compareTo(BigDecimal.valueOf(600000.00)));
                assertEquals("DRAFT", invoice.getStatus());

                // ─── Step 2: Transition Event status through states ───
                // PLANNING -> CONFIRMED
                mockMvc.perform(patch("/events/" + eventEntity.getId() + "/status")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\": \"CONFIRMED\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("CONFIRMED")));

                // CONFIRMED -> IN_PROGRESS
                mockMvc.perform(patch("/events/" + eventEntity.getId() + "/status")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\": \"IN_PROGRESS\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")));

                // IN_PROGRESS -> COMPLETED
                mockMvc.perform(patch("/events/" + eventEntity.getId() + "/status")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\": \"COMPLETED\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("COMPLETED")));

                // ─── Step 3: Register Vendor and Sign Contract ───
                CreateVendorDto createVendorDto = CreateVendorDto.builder()
                                .name("Apex Catering")
                                .contactName("Vikram")
                                .email("vikram@apexcaterers.com")
                                .phone("9988776655")
                                .serviceType("CATERING")
                                .build();

                MvcResult vendorResult = mockMvc.perform(post("/vendors")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createVendorDto)))
                                .andExpect(status().isCreated())
                                .andReturn();

                Map<?, ?> vendorMap = objectMapper.readValue(vendorResult.getResponse().getContentAsString(),
                                Map.class);
                Map<?, ?> vendorData = (Map<?, ?>) vendorMap.get("data");
                UUID vendorId = UUID.fromString((String) vendorData.get("id"));

                // Sign contract with vendor
                CreateVendorContractDto contractDto = CreateVendorContractDto.builder()
                                .vendorId(vendorId)
                                .bookingId(booking.getId())
                                .contractNumber("VC-2026-9011")
                                .details("Premium Multi-cuisine Catering Service")
                                .totalCost(BigDecimal.valueOf(200000.00))
                                .actualCost(BigDecimal.valueOf(180000.00))
                                .status("SIGNED")
                                .build();

                mockMvc.perform(post("/vendors/contracts")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(contractDto)))
                                .andExpect(status().isCreated());

                // ─── Step 4: Verify Booking Budget endpoint ───
                mockMvc.perform(get("/bookings/" + booking.getId() + "/budget")
                                .with(authentication(auth)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.revenue", anyOf(is((Object) 600000), is((Object) 600000.0), is((Object) 600000.00))))
                                .andExpect(jsonPath("$.data.estimatedCost", anyOf(is((Object) 200000), is((Object) 200000.0), is((Object) 200000.00))))
                                .andExpect(jsonPath("$.data.actualCost", anyOf(is((Object) 180000), is((Object) 180000.0), is((Object) 180000.00))))
                                .andExpect(jsonPath("$.data.profitMargin", anyOf(is((Object) 420000), is((Object) 420000.0), is((Object) 420000.00))))
                                .andExpect(jsonPath("$.data.profitMarginPercentage", anyOf(is((Object) 70), is((Object) 70.0), is((Object) 70.00))));

                // ─── Step 5: Record full payment and recalculate outstanding invoices ───
                CreatePaymentDto paymentDto = CreatePaymentDto.builder()
                                .bookingId(booking.getId())
                                .invoiceId(invoice.getId())
                                .amount(BigDecimal.valueOf(600000.00))
                                .paymentMethod("UPI")
                                .transactionReference("TXN-UPI-99120")
                                .paymentDate(LocalDateTime.now())
                                .notes("Settled full proposal invoice amount")
                                .build();

                mockMvc.perform(post("/payments")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(paymentDto)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success", is(true)));

                // Verify invoice is PAID
                Invoice updatedInvoice = invoiceRepository.findByIdAndTenantId(invoice.getId(), tenantId)
                                .orElseThrow(() -> new AssertionError("Invoice not found"));
                assertEquals("PAID", updatedInvoice.getStatus());
                assertEquals(0, updatedInvoice.getPaidAmount().compareTo(BigDecimal.valueOf(600000.00)));

                // Verify booking paid amount is updated
                Booking updatedBooking = bookingRepository.findByIdAndTenantId(booking.getId(), tenantId)
                                .orElseThrow(() -> new AssertionError("Booking not found"));
                assertEquals(0, updatedBooking.getPaidAmount().compareTo(BigDecimal.valueOf(600000.00)));

                // ─── Step 6: Verify Dashboard Analytics ───
                mockMvc.perform(get("/dashboard/metrics")
                                .with(authentication(auth)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.totalRevenue", anyOf(is((Object) 600000), is((Object) 600000.0), is((Object) 600000.00))))
                                .andExpect(jsonPath("$.data.pendingPayments", anyOf(is((Object) 0), is((Object) 0.0), is((Object) 0.00))))
                                .andExpect(jsonPath("$.data.outstandingInvoicesCount", is(0)))
                                .andExpect(jsonPath("$.data.outstandingInvoicesAmount", anyOf(is((Object) 0), is((Object) 0.0), is((Object) 0.00))))
                                .andExpect(jsonPath("$.data.estimatedCosts", anyOf(is((Object) 200000), is((Object) 200000.0), is((Object) 200000.00))))
                                .andExpect(jsonPath("$.data.actualCosts", anyOf(is((Object) 180000), is((Object) 180000.0), is((Object) 180000.00))))
                                .andExpect(jsonPath("$.data.profitMargin", anyOf(is((Object) 420000), is((Object) 420000.0), is((Object) 420000.00))))
                                .andExpect(jsonPath("$.data.profitMarginPercentage", anyOf(is((Object) 70), is((Object) 70.0), is((Object) 70.00))));
        }
}
