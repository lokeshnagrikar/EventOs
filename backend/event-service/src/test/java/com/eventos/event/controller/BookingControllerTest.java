package com.eventos.event.controller;

import com.eventos.event.config.JwtRequestFilter;
import com.eventos.event.config.UserPrincipal;
import com.eventos.event.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(BookingController.class)
@org.springframework.context.annotation.Import(com.eventos.event.config.SecurityConfig.class)
@SuppressWarnings("null")
public class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @org.springframework.boot.test.context.TestConfiguration
    static class TestConfig {
        @org.springframework.context.annotation.Bean
        public JwtRequestFilter jwtRequestFilter() {
            return new JwtRequestFilter() {
                @Override
                public void init() {
                    // Do nothing to avoid dependency on jwtSecret in test context
                }
                @Override
                protected void doFilterInternal(
                        @org.springframework.lang.NonNull jakarta.servlet.http.HttpServletRequest request,
                        @org.springframework.lang.NonNull jakarta.servlet.http.HttpServletResponse response,
                        @org.springframework.lang.NonNull jakarta.servlet.FilterChain filterChain)
                        throws jakarta.servlet.ServletException, java.io.IOException {
                    filterChain.doFilter(request, response);
                }
            };
        }
    }

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
    }

    private org.springframework.security.core.Authentication getMockAuth(String roles) {
        UserPrincipal principal = new UserPrincipal(UUID.randomUUID(), tenantId, "user@test.com", roles);
        java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> authorities =
                java.util.Arrays.stream(roles.split(","))
                        .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + r.trim().toUpperCase()))
                        .toList();
        return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, authorities);
    }

    @Test
    void testGetBookings_Owner_Success() throws Exception {
        org.springframework.security.core.Authentication ownerAuth = getMockAuth("OWNER");
        
        mockMvc.perform(get("/bookings")
                .with(authentication(ownerAuth)))
                .andExpect(status().isOk());
    }

    @Test
    void testCreateBooking_Client_Forbidden() throws Exception {
        org.springframework.security.core.Authentication clientAuth = getMockAuth("CLIENT");
        
        mockMvc.perform(post("/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"eventId\":\"" + UUID.randomUUID() + "\",\"totalAmount\":100.0,\"paidAmount\":0.0}")
                .with(authentication(clientAuth))
                .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDeleteResource_Admin_Success() throws Exception {
        org.springframework.security.core.Authentication adminAuth = getMockAuth("ADMIN");
        UUID bookingId = UUID.randomUUID();
        UUID resourceId = UUID.randomUUID();

        mockMvc.perform(delete("/bookings/" + bookingId + "/resources/" + resourceId)
                .with(authentication(adminAuth))
                .with(csrf()))
                .andExpect(status().isOk());
    }
}
