package com.eventos.crm.integration;

import com.eventos.crm.config.UserPrincipal;
import com.eventos.crm.dto.*;
import com.eventos.crm.entity.*;
import com.eventos.crm.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class CrmIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private TenantSequenceRepository tenantSequenceRepository;

        @MockBean
        private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

        @MockBean
        private ApplicationEventPublisher eventPublisher;

        private UUID tenantA;
        private UUID tenantB;
        private Authentication authA;
        private Authentication authB;

        @BeforeEach
        void setUp() {
                tenantA = UUID.randomUUID();
                tenantB = UUID.randomUUID();

                // Setup Tenant A Owner Authentication
                UserPrincipal principalA = new UserPrincipal(UUID.randomUUID(), tenantA, "ownerA@eventos.com", "OWNER");
                authA = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                principalA, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));

                // Setup Tenant B Owner Authentication
                UserPrincipal principalB = new UserPrincipal(UUID.randomUUID(), tenantB, "ownerB@eventos.com", "OWNER");
                authB = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                principalB, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));

                // Setup a Quote sequence for both tenants
                tenantSequenceRepository.save(TenantSequence.builder().tenantId(tenantA).sequenceType("QUOTE")
                                .currentValue(0).build());
                tenantSequenceRepository.save(TenantSequence.builder().tenantId(tenantB).sequenceType("QUOTE")
                                .currentValue(0).build());
        }

        @Test
        void testCompleteCrmWorkflowAndTenantIsolation() throws Exception {
                // ─── 1. CONTACT MANAGEMENT ───
                // Create Contact for Tenant A
                CreateContactDto contactDto = CreateContactDto.builder()
                                .firstName("Rohan")
                                .lastName("Mehra")
                                .email("rohan@mehra.com")
                                .phone("9876543210")
                                .companyName("Mehra Events")
                                .build();

                MvcResult contactResult = mockMvc.perform(post("/contacts")
                                .with(authentication(authA))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(contactDto)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.firstName", is("Rohan")))
                                .andExpect(jsonPath("$.data.id").exists())
                                .andReturn();

                Map<?, ?> contactMap = objectMapper.readValue(contactResult.getResponse().getContentAsString(),
                                Map.class);
                Map<?, ?> contactData = (Map<?, ?>) contactMap.get("data");
                String contactIdStr = (String) contactData.get("id");
                UUID contactId = UUID.fromString(contactIdStr);

                // ─── 2. LEAD MANAGEMENT ───
                // Create Lead for Tenant A
                CreateLeadDto leadDto = CreateLeadDto.builder()
                                .name("Rohan Reception")
                                .contactId(contactId)
                                .eventType("WEDDING")
                                .eventDate(LocalDate.now().plusMonths(3))
                                .budget(BigDecimal.valueOf(400000.00))
                                .leadSource("WEBSITE")
                                .notes("Need high-end decor and catering.")
                                .build();

                MvcResult leadResult = mockMvc.perform(post("/leads")
                                .with(authentication(authA))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(leadDto)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.name", is("Rohan Reception")))
                                .andExpect(jsonPath("$.data.status", is("NEW")))
                                .andReturn();

                Map<?, ?> leadMap = objectMapper.readValue(leadResult.getResponse().getContentAsString(), Map.class);
                Map<?, ?> leadData = (Map<?, ?>) leadMap.get("data");
                String leadIdStr = (String) leadData.get("id");
                UUID leadId = UUID.fromString(leadIdStr);

                // Verify Tenant Isolation: Tenant B tries to get Tenant A's lead -> Expected
                // 404 (Not Found)
                mockMvc.perform(get("/leads/" + leadId)
                                .with(authentication(authB)))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.success", is(false)))
                                .andExpect(jsonPath("$.error.code", is("NOT_FOUND")));

                // Transition Lead status to QUALIFIED
                mockMvc.perform(patch("/leads/" + leadId + "/status")
                                .with(authentication(authA))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\": \"QUALIFIED\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("QUALIFIED")));

                // ─── 3. QUOTE MANAGEMENT ───
                // Create Quote for Tenant A
                CreateQuoteItemDto item = CreateQuoteItemDto.builder()
                                .itemName("Stage Decor")
                                .description("Elegant floral stage design")
                                .unitPrice(BigDecimal.valueOf(150000.00))
                                .quantity(1)
                                .build();

                CreateQuoteDto quoteDto = CreateQuoteDto.builder()
                                .leadId(leadId)
                                .templateName("MINIMALIST")
                                .discount(BigDecimal.valueOf(10000.00))
                                .taxRate(BigDecimal.valueOf(18.00))
                                .clientNotes("Standard terms apply.")
                                .items(Collections.singletonList(item))
                                .build();

                MvcResult quoteResult = mockMvc.perform(post("/quotes")
                                .with(authentication(authA))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(quoteDto)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.subtotal", is(150000.0)))
                                .andExpect(jsonPath("$.data.discount", is(10000.0)))
                                .andExpect(jsonPath("$.data.tax", is(25200.0))) // 18% of (150000 - 10000)
                                .andExpect(jsonPath("$.data.total", is(165200.0)))
                                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                                .andReturn();

                Map<?, ?> quoteMap = objectMapper.readValue(quoteResult.getResponse().getContentAsString(), Map.class);
                Map<?, ?> quoteData = (Map<?, ?>) quoteMap.get("data");
                String quoteIdStr = (String) quoteData.get("id");
                UUID quoteId = UUID.fromString(quoteIdStr);

                // Verify Tenant Isolation: Tenant B tries to get Tenant A's quote -> Expected
                // 4xx client error
                mockMvc.perform(get("/quotes/" + quoteId)
                                .with(authentication(authB)))
                                .andExpect(status().is4xxClientError());

                // ─── 4. QUOTE VERSIONING / REVISIONS ───
                // Create Revision of Quote
                MvcResult revisionResult = mockMvc.perform(post("/quotes/" + quoteId + "/revision")
                                .with(authentication(authA))
                                .with(csrf()))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.revisionNumber", is(2)))
                                .andExpect(jsonPath("$.data.quoteNumber", org.hamcrest.Matchers.endsWith("-v2")))
                                .andReturn();

                Map<?, ?> revisionMap = objectMapper.readValue(revisionResult.getResponse().getContentAsString(),
                                Map.class);
                Map<?, ?> revisionData = (Map<?, ?>) revisionMap.get("data");
                String revisionIdStr = (String) revisionData.get("id");
                UUID revisionId = UUID.fromString(revisionIdStr);

                // Send Quote (Move status: DRAFT -> SENT)
                mockMvc.perform(patch("/quotes/" + revisionId + "/status")
                                .with(authentication(authA))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"status\": \"SENT\"}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("SENT")));

                // View Quote (Move status: SENT -> VIEWED)
                mockMvc.perform(post("/quotes/" + revisionId + "/view")
                                .with(authentication(authA))
                                .with(csrf()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("VIEWED")));

                // ─── 5. QUOTE APPROVAL & EVENT PUBLISHING ───
                // Approve Quote
                mockMvc.perform(post("/quotes/" + revisionId + "/approve")
                                .with(authentication(authA))
                                .with(csrf()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("ACCEPTED")));

                // Verify that Lead status was promoted to WON
                mockMvc.perform(get("/leads/" + leadId)
                                .with(authentication(authA)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("WON")));

                verify(rabbitTemplate, atLeastOnce()).convertAndSend(
                                eq("eventos.exchange"),
                                eq("quote.accepted"),
                                any(com.eventos.crm.event.QuoteAcceptedEvent.class));

                // ─── 6. DASHBOARD ANALYTICS ───
                // Retrieve Dashboard Metrics for Tenant A (OWNER role)
                mockMvc.perform(get("/dashboard/metrics")
                                .with(authentication(authA)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.leadMetrics.totalLeads", is(1)))
                                .andExpect(jsonPath("$.data.leadMetrics.conversionRate",
                                                anyOf(is((Object) 100), is((Object) 100.0))))
                                .andExpect(jsonPath("$.data.leadMetrics.pipelineValue",
                                                anyOf(is((Object) 0), is((Object) 0.0)))) // lead is now WON, so
                                                                                          // pipeline value is 0
                                .andExpect(jsonPath("$.data.leadMetrics.revenueForecast", anyOf(is((Object) 400000),
                                                is((Object) 400000.0), is((Object) 400000.00)))); // lead budget is
                                                                                                  // 400000, conversion
                                                                                                  // rate is 100%
        }
}
