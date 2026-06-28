package com.eventos.event.integration;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.CreateInvoiceDto;
import com.eventos.event.dto.UpdateInvoiceStatusDto;
import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Invoice;
import com.eventos.event.entity.InvoiceHistory;
import com.eventos.event.entity.Payment;
import com.eventos.event.entity.TenantSequence;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceHistoryRepository;
import com.eventos.event.repository.InvoiceRepository;
import com.eventos.event.repository.PaymentRepository;
import com.eventos.event.repository.TenantSequenceRepository;
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
import java.util.List;
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
public class InvoiceManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InvoiceHistoryRepository invoiceHistoryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private TenantSequenceRepository tenantSequenceRepository;

    @MockBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    private UUID tenantId;
    private UUID otherTenantId;
    private Authentication auth;
    private Authentication otherAuth;
    private Booking bookingEntity;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        otherTenantId = UUID.randomUUID();

        // Active Tenant Auth (OWNER role)
        UserPrincipal principal = new UserPrincipal(UUID.randomUUID(), tenantId, "owner@eventos.com", "OWNER");
        auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                principal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));

        // Other Tenant Auth (OWNER role)
        UserPrincipal otherPrincipal = new UserPrincipal(UUID.randomUUID(), otherTenantId, "otherowner@eventos.com", "OWNER");
        otherAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                otherPrincipal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));

        // Setup sequences for sequence validation
        tenantSequenceRepository.save(TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("INVOICE")
                .currentValue(0)
                .build());

        tenantSequenceRepository.save(TenantSequence.builder()
                .tenantId(otherTenantId)
                .sequenceType("INVOICE")
                .currentValue(0)
                .build());

        // Create base Booking
        bookingEntity = Booking.builder()
                .clientName("Dev Gupta")
                .clientEmail("dev@gupta.com")
                .clientPhone("9876543210")
                .bookingNumber("BK-3001")
                .status(com.eventos.event.entity.BookingStatus.CONFIRMED)
                .totalAmount(BigDecimal.valueOf(50000.00))
                .paidAmount(BigDecimal.ZERO)
                .build();
        bookingEntity.setTenantId(tenantId);
        bookingEntity = bookingRepository.save(bookingEntity);
    }

    @Test
    void testCreateInvoiceWithTaxRate_CalculatesTotalsAndLogsHistory() throws Exception {
        CreateInvoiceDto dto = CreateInvoiceDto.builder()
                .bookingId(bookingEntity.getId())
                .subtotal(BigDecimal.valueOf(1000.00))
                .tax(BigDecimal.ZERO) // will be overridden by taxRate computation in InvoiceService
                .taxRate(BigDecimal.valueOf(18.00)) // 18% tax
                .discount(BigDecimal.valueOf(100.00))
                .dueDate(LocalDateTime.now().plusDays(10))
                .clientName("Dev Gupta")
                .clientEmail("dev@gupta.com")
                .billingAddress("12 Ring Road, Delhi")
                .notes("Milestone invoice with tax rate")
                .build();

        // 1000 subtotal + 180 tax (18%) - 100 discount = 1080.00 total
        BigDecimal expectedTotal = BigDecimal.valueOf(1080.00);

        MvcResult result = mockMvc.perform(post("/invoices")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.invoiceNumber", matchesPattern("^INV-\\d{4}-000001$")))
                .andExpect(jsonPath("$.data.totalAmount", is(1080.0)))
                .andExpect(jsonPath("$.data.tax", is(180.0)))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) responseMap.get("data");
        UUID invoiceId = UUID.fromString((String) dataMap.get("id"));

        // Fetch invoice history and verify CREATED event
        mockMvc.perform(get("/invoices/" + invoiceId + "/history")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].status", is("DRAFT")))
                .andExpect(jsonPath("$.data[0].action", is("CREATED")));
    }

    @Test
    void testGetInvoicePdf() throws Exception {
        // Create an Invoice
        Invoice invoice = Invoice.builder()
                .bookingId(bookingEntity.getId())
                .invoiceNumber("INV-2026-000099")
                .subtotal(BigDecimal.valueOf(100.0))
                .tax(BigDecimal.valueOf(10.0))
                .discount(BigDecimal.valueOf(5.0))
                .totalAmount(BigDecimal.valueOf(105.0))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDateTime.now().plusDays(5))
                .status("DRAFT")
                .clientName("Dev Gupta")
                .build();
        invoice.setTenantId(tenantId);
        invoice = invoiceRepository.save(invoice);

        mockMvc.perform(get("/invoices/" + invoice.getId() + "/pdf")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=\"invoice-INV-2026-000099.pdf\"")))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }

    @Test
    void testGetInvoiceHistory() throws Exception {
        Invoice invoice = Invoice.builder()
                .bookingId(bookingEntity.getId())
                .invoiceNumber("INV-2026-000088")
                .subtotal(BigDecimal.valueOf(500.0))
                .tax(BigDecimal.valueOf(50.0))
                .discount(BigDecimal.valueOf(0.0))
                .totalAmount(BigDecimal.valueOf(550.0))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDateTime.now().plusDays(5))
                .status("DRAFT")
                .clientName("Dev Gupta")
                .build();
        invoice.setTenantId(tenantId);
        invoice = invoiceRepository.save(invoice);

        // 1. Manually add history entry for creation
        InvoiceHistory creationHistory = InvoiceHistory.builder()
                .invoiceId(invoice.getId())
                .status("DRAFT")
                .action("CREATED")
                .notes("Created manually")
                .actionBy("owner@eventos.com")
                .build();
        creationHistory.setTenantId(tenantId);
        invoiceHistoryRepository.save(creationHistory);

        // 2. Perform manual status update
        UpdateInvoiceStatusDto statusDto = new UpdateInvoiceStatusDto();
        statusDto.setStatus("SENT");

        mockMvc.perform(put("/invoices/" + invoice.getId() + "/status")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusDto)))
                .andExpect(status().isOk());

        // 3. Verify history logs list both CREATED and STATUS_UPDATE
        mockMvc.perform(get("/invoices/" + invoice.getId() + "/history")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].status", is("SENT")))
                .andExpect(jsonPath("$.data[0].action", is("STATUS_UPDATE")))
                .andExpect(jsonPath("$.data[1].status", is("DRAFT")))
                .andExpect(jsonPath("$.data[1].action", is("CREATED")));
    }

    @Test
    void testReconcileInvoice() throws Exception {
        Invoice invoice = Invoice.builder()
                .bookingId(bookingEntity.getId())
                .invoiceNumber("INV-2026-000077")
                .subtotal(BigDecimal.valueOf(1000.0))
                .tax(BigDecimal.valueOf(180.0))
                .discount(BigDecimal.valueOf(180.0))
                .totalAmount(BigDecimal.valueOf(1000.0))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDateTime.now().plusDays(5))
                .status("SENT")
                .clientName("Dev Gupta")
                .build();
        invoice.setTenantId(tenantId);
        invoice = invoiceRepository.save(invoice);

        // 1. Create a SUCCESSFUL Payment for 400.00
        Payment payment1 = Payment.builder()
                .bookingId(bookingEntity.getId())
                .invoiceId(invoice.getId())
                .amount(BigDecimal.valueOf(400.00))
                .paymentMethod("UPI")
                .status("SUCCESSFUL")
                .paymentDate(LocalDateTime.now())
                .build();
        payment1.setTenantId(tenantId);
        paymentRepository.save(payment1);

        // 2. Perform reconciliation
        mockMvc.perform(post("/invoices/" + invoice.getId() + "/reconcile")
                        .with(authentication(auth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.paidAmount", is(400.0)))
                .andExpect(jsonPath("$.data.status", is("PARTIALLY_PAID")));

        // 3. Add second SUCCESSFUL Payment for 600.00 (making total 1000.00)
        Payment payment2 = Payment.builder()
                .bookingId(bookingEntity.getId())
                .invoiceId(invoice.getId())
                .amount(BigDecimal.valueOf(600.00))
                .paymentMethod("BANK_TRANSFER")
                .status("SUCCESSFUL")
                .paymentDate(LocalDateTime.now())
                .build();
        payment2.setTenantId(tenantId);
        paymentRepository.save(payment2);

        // 4. Perform reconciliation again
        mockMvc.perform(post("/invoices/" + invoice.getId() + "/reconcile")
                        .with(authentication(auth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.paidAmount", is(1000.0)))
                .andExpect(jsonPath("$.data.status", is("PAID")));

        // 5. Fetch history and verify RECONCILED history logs exist
        mockMvc.perform(get("/invoices/" + invoice.getId() + "/history")
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].action", is("RECONCILED")))
                .andExpect(jsonPath("$.data[0].status", is("PAID")))
                .andExpect(jsonPath("$.data[1].action", is("RECONCILED")))
                .andExpect(jsonPath("$.data[1].status", is("PARTIALLY_PAID")));
    }

    @Test
    void testTenantBoundaryChecks() throws Exception {
        // Create an Invoice in Active Tenant
        Invoice invoice = Invoice.builder()
                .bookingId(bookingEntity.getId())
                .invoiceNumber("INV-2026-000066")
                .subtotal(BigDecimal.valueOf(100.0))
                .tax(BigDecimal.valueOf(0.0))
                .discount(BigDecimal.valueOf(0.0))
                .totalAmount(BigDecimal.valueOf(100.0))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDateTime.now().plusDays(5))
                .status("DRAFT")
                .clientName("Dev Gupta")
                .build();
        invoice.setTenantId(tenantId);
        invoice = invoiceRepository.save(invoice);

        // 1. Attempt PDF retrieval by other tenant -> should return 404/400 (Not Found / Access Denied)
        mockMvc.perform(get("/invoices/" + invoice.getId() + "/pdf")
                        .with(authentication(otherAuth)))
                .andExpect(status().isNotFound());

        // 2. Attempt history retrieval by other tenant -> should return 404/400
        mockMvc.perform(get("/invoices/" + invoice.getId() + "/history")
                        .with(authentication(otherAuth)))
                .andExpect(status().isNotFound());

        // 3. Attempt reconciliation by other tenant -> should return 404/400
        mockMvc.perform(post("/invoices/" + invoice.getId() + "/reconcile")
                        .with(authentication(otherAuth))
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }
}
