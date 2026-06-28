package com.eventos.auth.consumer;

import com.eventos.auth.event.BookingCreatedEvent;
import com.eventos.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingCreatedConsumerTest {

        @Mock
        private AuthService authService;

        @InjectMocks
        private BookingCreatedConsumer bookingCreatedConsumer;

        private UUID tenantId;
        private UUID bookingId;

        @BeforeEach
        void setUp() {
                tenantId = UUID.randomUUID();
                bookingId = UUID.randomUUID();
        }

        @Test
        void testConsumeBookingCreatedEvent_Success() {
                BookingCreatedEvent event = BookingCreatedEvent.builder()
                                .bookingId(bookingId)
                                .tenantId(tenantId)
                                .clientEmail("client@example.com")
                                .clientName("John Doe")
                                .totalAmount(BigDecimal.valueOf(10000))
                                .build();

                Map<String, Object> mockResult = new HashMap<>();
                mockResult.put("success", true);
                mockResult.put("inviteToken", "mock-token-xyz");

                when(authService.inviteTeamMember(
                                eq(tenantId),
                                eq("client@example.com"),
                                eq("John"),
                                eq("Doe"),
                                eq("CLIENT"),
                                eq(null),
                                eq(null))).thenReturn(mockResult);

                bookingCreatedConsumer.consumeBookingCreatedEvent(event);

                verify(authService, times(1)).inviteTeamMember(
                                eq(tenantId),
                                eq("client@example.com"),
                                eq("John"),
                                eq("Doe"),
                                eq("CLIENT"),
                                eq(null),
                                eq(null));
        }

        @Test
        void testConsumeBookingCreatedEvent_SingleName() {
                BookingCreatedEvent event = BookingCreatedEvent.builder()
                                .bookingId(bookingId)
                                .tenantId(tenantId)
                                .clientEmail("client@example.com")
                                .clientName("Alice")
                                .totalAmount(BigDecimal.valueOf(5000))
                                .build();

                Map<String, Object> mockResult = new HashMap<>();
                mockResult.put("success", true);
                mockResult.put("inviteToken", "mock-token-abc");

                when(authService.inviteTeamMember(
                                eq(tenantId),
                                eq("client@example.com"),
                                eq("Alice"),
                                eq(""),
                                eq("CLIENT"),
                                eq(null),
                                eq(null))).thenReturn(mockResult);

                bookingCreatedConsumer.consumeBookingCreatedEvent(event);

                verify(authService, times(1)).inviteTeamMember(
                                eq(tenantId),
                                eq("client@example.com"),
                                eq("Alice"),
                                eq(""),
                                eq("CLIENT"),
                                eq(null),
                                eq(null));
        }

        @Test
        void testConsumeBookingCreatedEvent_NoEmail() {
                BookingCreatedEvent event = BookingCreatedEvent.builder()
                                .bookingId(bookingId)
                                .tenantId(tenantId)
                                .clientEmail("")
                                .clientName("John Doe")
                                .build();

                bookingCreatedConsumer.consumeBookingCreatedEvent(event);

                verify(authService, never()).inviteTeamMember(any(), any(), any(), any(), any(), any(), any());
        }

        @Test
        void testConsumeBookingCreatedEvent_AlreadyMember() {
                BookingCreatedEvent event = BookingCreatedEvent.builder()
                                .bookingId(bookingId)
                                .tenantId(tenantId)
                                .clientEmail("client@example.com")
                                .clientName("John Doe")
                                .build();

                when(authService.inviteTeamMember(
                                eq(tenantId),
                                eq("client@example.com"),
                                eq("John"),
                                eq("Doe"),
                                eq("CLIENT"),
                                eq(null),
                                eq(null)))
                                .thenThrow(new IllegalArgumentException("User is already a member of this tenant"));

                // Should not throw exception to caller, but catch it and log gracefully
                bookingCreatedConsumer.consumeBookingCreatedEvent(event);

                verify(authService, times(1)).inviteTeamMember(
                                eq(tenantId),
                                eq("client@example.com"),
                                eq("John"),
                                eq("Doe"),
                                eq("CLIENT"),
                                eq(null),
                                eq(null));
        }

        @Test
        void testConsumeBookingCreatedEvent_TransientException() {
                BookingCreatedEvent event = BookingCreatedEvent.builder()
                                .bookingId(bookingId)
                                .tenantId(tenantId)
                                .clientEmail("client@example.com")
                                .clientName("John Doe")
                                .build();

                when(authService.inviteTeamMember(
                                eq(tenantId),
                                eq("client@example.com"),
                                eq("John"),
                                eq("Doe"),
                                eq("CLIENT"),
                                eq(null),
                                eq(null))).thenThrow(new RuntimeException("Database down"));

                // Should propagate runtime exceptions to allow DLQ retry mechanism
                assertThrows(RuntimeException.class, () -> {
                        bookingCreatedConsumer.consumeBookingCreatedEvent(event);
                });
        }
}
