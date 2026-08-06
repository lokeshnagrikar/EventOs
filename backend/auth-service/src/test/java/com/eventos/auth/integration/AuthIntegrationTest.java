package com.eventos.auth.integration;

import com.eventos.auth.dto.*;
import com.eventos.auth.entity.*;
import com.eventos.auth.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("null")
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PlanRepository planRepository;

    @MockBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    @MockBean
    private com.eventos.auth.service.EmailService emailService;

    private Role ownerRole;

    @BeforeEach
    void setUp() {
        // Ensure OWNER role exists in DB
        Optional<Role> roleOpt = roleRepository.findByName("OWNER");
        if (roleOpt.isEmpty()) {
            ownerRole = Role.builder()
                    .name("OWNER")
                    .description("Workspace Owner")
                    .build();
            ownerRole = roleRepository.save(ownerRole);
        } else {
            ownerRole = roleOpt.get();
        }

        // Ensure free_trial plan exists in DB for tests
        if (planRepository.findByCode("free_trial").isEmpty()) {
            planRepository.save(Plan.builder()
                    .name("Free Trial")
                    .code("free_trial")
                    .price(java.math.BigDecimal.ZERO)
                    .currency("INR")
                    .billingInterval("MONTHLY")
                    .maxUsers(3)
                    .maxStorage(5368709120L)
                    .maxGalleryUploads(20)
                    .maxEvents(5)
                    .maxLeads(10)
                    .maxAiCredits(50)
                    .maxAutomationRuns(100)
                    .maxApiCalls(1000)
                    .customDomainSupported(false)
                    .whiteLabelSupported(false)
                    .build());
        }

        // Mock stringRedisTemplate behavior to avoid null pointers during login/lockout/rate limit checks
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);
    }

    @Test
    void testRegistrationAndLoginFlow() throws Exception {
        // 1. Register Workspace
        RegisterRequestDto regRequest = RegisterRequestDto.builder()
                .email("integration@test.com")
                .firstName("Integration")
                .lastName("User")
                .companyName("Integration Org")
                .password("SecurePass123")
                .phone("9999999999")
                .build();

        org.springframework.test.web.servlet.MvcResult regResult = mockMvc.perform(post("/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("registered successfully")))
                .andReturn();

        String regResponseBody = regResult.getResponse().getContentAsString();
        String verificationToken = objectMapper.readTree(regResponseBody).get("verificationToken").asText();

        // 1b. Verify Email using OTP POST endpoint
        VerifyOtpRequestDto otpRequest = VerifyOtpRequestDto.builder()
                .email("integration@test.com")
                .otp(verificationToken)
                .build();

        mockMvc.perform(post("/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otpRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Email verification successful")));

        // 2. Login
        LoginRequestDto loginRequest = LoginRequestDto.builder()
                .email("integration@test.com")
                .password("SecurePass123")
                .build();

        mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.userId", notNullValue()))
                .andExpect(jsonPath("$.data.tenantId", notNullValue()))
                .andExpect(jsonPath("$.data.role", is("OWNER")));

        // 3. Login with invalid password
        LoginRequestDto invalidLoginRequest = LoginRequestDto.builder()
                .email("integration@test.com")
                .password("WrongPass")
                .build();

        mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLoginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_CREDENTIALS")));
    }
}
