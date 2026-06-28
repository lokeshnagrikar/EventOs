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
public class VendorManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private VendorContractRepository vendorContractRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TimelineTaskRepository timelineTaskRepository;

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

        // Setup sequences for sequences validation
        tenantSequenceRepository.saveAndFlush(TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("BOOKING")
                .currentValue(0)
                .build());

        tenantSequenceRepository.saveAndFlush(TenantSequence.builder()
                .tenantId(otherTenantId)
                .sequenceType("BOOKING")
                .currentValue(0)
                .build());

        // Create base Event & Booking for tests
        eventEntity = Event.builder()
                .name("Corporate Vendor Meet")
                .type(EventType.CORPORATE)
                .status(EventStatus.PLANNING)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(6))
                .build();
        eventEntity.setTenantId(tenantId);
        eventEntity = eventRepository.save(eventEntity);

        bookingEntity = Booking.builder()
                .eventId(eventEntity.getId())
                .clientName("Suresh Kumar")
                .clientEmail("suresh@kumar.com")
                .clientPhone("9988998899")
                .bookingNumber("EVT-1002")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(BigDecimal.valueOf(100000.00))
                .paidAmount(BigDecimal.ZERO)
                .build();
        bookingEntity.setTenantId(tenantId);
        bookingEntity = bookingRepository.save(bookingEntity);
    }

    @Test
    void testVendorCrudWithCategoryEnum() throws Exception {
        // 1. Create vendor with CATERING category
        CreateVendorDto createDto = CreateVendorDto.builder()
                .name("Gourmet Catering Services")
                .contactName("Aditya")
                .email("aditya@gourmet.com")
                .phone("9911223344")
                .serviceType("CATERING")
                .build();

        MvcResult createResult = mockMvc.perform(post("/vendors")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Gourmet Catering Services")))
                .andExpect(jsonPath("$.data.serviceType", is("CATERING")))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) responseMap.get("data");
        UUID vendorId = UUID.fromString((String) dataMap.get("id"));

        // 2. Fetch vendor details
        mockMvc.perform(get("/vendors/" + vendorId)
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.serviceType", is("CATERING")));

        // 3. Update vendor to TRANSPORT category
        CreateVendorDto updateDto = CreateVendorDto.builder()
                .name("Gourmet Catering Services")
                .contactName("Aditya")
                .email("aditya@gourmet.com")
                .phone("9911223344")
                .serviceType("TRANSPORT")
                .build();

        mockMvc.perform(put("/vendors/" + vendorId)
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.serviceType", is("TRANSPORT")));

        // 4. Verify invalid category throws BAD REQUEST
        CreateVendorDto invalidCategoryDto = CreateVendorDto.builder()
                .name("Gourmet Catering Services")
                .contactName("Aditya")
                .serviceType("INVALID_CAT")
                .build();

        mockMvc.perform(post("/vendors")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidCategoryDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testVendorContractCostAndPaymentTracking() throws Exception {
        // 1. Create a Vendor
        Vendor vendor = Vendor.builder()
                .name("Elegant Decorators")
                .serviceType(VendorCategory.DECORATION)
                .status("ACTIVE")
                .build();
        vendor.setTenantId(tenantId);
        vendor = vendorRepository.save(vendor);

        // 2. Create Contract (Initial state: unpaid, totalCost = 15000, actualCost = 12000, paidAmount = 0)
        CreateVendorContractDto contractDto = CreateVendorContractDto.builder()
                .vendorId(vendor.getId())
                .bookingId(bookingEntity.getId())
                .contractNumber("VC-CON-8877")
                .details("Stage flower decoration")
                .totalCost(BigDecimal.valueOf(15000.00))
                .actualCost(BigDecimal.valueOf(12000.00))
                .status("PENDING")
                .paidAmount(BigDecimal.ZERO)
                .build();

        MvcResult contractResult = mockMvc.perform(post("/vendors/contracts")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(contractDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.paymentStatus", is("UNPAID")))
                .andExpect(jsonPath("$.data.paidAmount", is(0)))
                .andReturn();

        Map<?, ?> contractMap = objectMapper.readValue(contractResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> contractData = (Map<?, ?>) contractMap.get("data");
        UUID contractId = UUID.fromString((String) contractData.get("id"));

        // 3. Record partial payment (5000.00) -> Status should become PARTIALLY_PAID
        RecordVendorPaymentDto paymentDto1 = RecordVendorPaymentDto.builder()
                .amount(BigDecimal.valueOf(5000.00))
                .build();

        mockMvc.perform(post("/vendors/contracts/" + contractId + "/payments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentDto1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.paidAmount", is(5000.00)))
                .andExpect(jsonPath("$.data.paymentStatus", is("PARTIALLY_PAID")));

        // 4. Record additional payment to complete/exceed actualCost (7000.00, making total paid 12000.00) -> Status should become PAID
        RecordVendorPaymentDto paymentDto2 = RecordVendorPaymentDto.builder()
                .amount(BigDecimal.valueOf(7000.00))
                .build();

        mockMvc.perform(post("/vendors/contracts/" + contractId + "/payments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentDto2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.paidAmount", is(12000.00)))
                .andExpect(jsonPath("$.data.paymentStatus", is("PAID")));
    }

    @Test
    void testVendorAssignmentToEventTask() throws Exception {
        // 1. Create a Vendor
        Vendor vendor = Vendor.builder()
                .name("Grand Palace Venue")
                .serviceType(VendorCategory.VENUE)
                .status("ACTIVE")
                .build();
        vendor.setTenantId(tenantId);
        vendor = vendorRepository.save(vendor);

        // 2. Create TimelineTask on Event
        TimelineTask task = TimelineTask.builder()
                .eventId(eventEntity.getId())
                .title("Finalize Venue Layout")
                .description("Coordinate with decorators on layout")
                .dueDate(LocalDateTime.now().plusDays(3))
                .priority(TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .completed(false)
                .build();
        task.setTenantId(tenantId);
        task = timelineTaskRepository.save(task);

        // 3. Assign vendor to Booking and Task
        CreateVendorAssignmentDto assignmentDto = CreateVendorAssignmentDto.builder()
                .vendorId(vendor.getId())
                .bookingId(bookingEntity.getId())
                .taskId(task.getId())
                .roleDescription("Primary Venue Partner")
                .build();

        mockMvc.perform(post("/vendors/assignments")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignmentDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.roleDescription", is("Primary Venue Partner")))
                .andExpect(jsonPath("$.data.taskId", is(task.getId().toString())));
    }

    @Test
    void testTenantBoundaryChecks() throws Exception {
        // 1. Create Vendor under active tenant
        Vendor vendor = Vendor.builder()
                .name("Secret Catering")
                .serviceType(VendorCategory.CATERING)
                .status("ACTIVE")
                .build();
        vendor.setTenantId(tenantId);
        vendor = vendorRepository.save(vendor);

        // 2. Attempt to view vendor details using otherTenantId context -> Should return 404
        mockMvc.perform(get("/vendors/" + vendor.getId())
                        .with(authentication(otherAuth)))
                .andExpect(status().isNotFound());

        // 3. Attempt to register a contract for vendor under other tenant context -> Should return 404
        CreateVendorContractDto crossTenantContract = CreateVendorContractDto.builder()
                .vendorId(vendor.getId())
                .bookingId(bookingEntity.getId()) // booking belongs to tenantId
                .contractNumber("VC-CROSS-999")
                .totalCost(BigDecimal.valueOf(1000.00))
                .build();

        mockMvc.perform(post("/vendors/contracts")
                        .with(authentication(otherAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(crossTenantContract)))
                .andExpect(status().isNotFound());
    }
}
