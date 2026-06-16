package com.eventos.event.controller;

import com.eventos.event.dto.EventDashboardMetricsDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.EventTimelineItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EventDashboardControllerTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EventTimelineItemRepository eventTimelineItemRepository;

    @InjectMocks
    private EventDashboardController eventDashboardController;

    private UUID tenantId;
    private Event mockEvent;
    private Booking mockBooking;
    private EventTimelineItem mockTask;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        mockEvent = Event.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .name("Verma Reception Setup")
                .type(EventType.WEDDING)
                .status(EventStatus.CONFIRMED)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(6))
                .location("Sheraton Banquet A")
                .build();

        mockBooking = Booking.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .bookingNumber("BK-9081")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(BigDecimal.valueOf(200000))
                .paidAmount(BigDecimal.valueOf(150000))
                .build();

        mockTask = EventTimelineItem.builder()
                .id(UUID.randomUUID())
                .eventId(mockEvent.getId())
                .title("Verify floral stage sizes")
                .scheduledTime(LocalDateTime.now().plusDays(3))
                .completed(false)
                .build();
    }

    @Test
    void testGetDashboardMetrics() {
        // Mock Security Context tenant context
        com.eventos.event.config.UserPrincipal principal = new com.eventos.event.config.UserPrincipal(
                UUID.randomUUID(), tenantId, "user@test.com", "ADMIN");
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);
        org.springframework.security.core.context.SecurityContext context = mock(org.springframework.security.core.context.SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        org.springframework.security.core.context.SecurityContextHolder.setContext(context);

        try {
            when(eventRepository.countByTenantIdAndStartDateAfter(eq(tenantId), any(LocalDateTime.class)))
                    .thenReturn(1L);
            when(eventRepository.findTop5ByTenantIdAndStartDateAfterOrderByStartDateAsc(eq(tenantId), any(LocalDateTime.class)))
                    .thenReturn(Collections.singletonList(mockEvent));

            List<Object[]> revSummary = new ArrayList<>();
            revSummary.add(new Object[]{mockBooking.getTotalAmount(), mockBooking.getPaidAmount()});
            when(bookingRepository.getBookingRevenueSummary(tenantId))
                    .thenReturn(revSummary);

            when(eventTimelineItemRepository.findAllByTenantIdAndCompletedOrderByScheduledTimeAsc(tenantId, false))
                    .thenReturn(Collections.singletonList(mockTask));
            when(eventRepository.findAllByIdInAndTenantId(anyList(), eq(tenantId)))
                    .thenReturn(Collections.singletonList(mockEvent));

            ResponseEntity<?> responseEntity = eventDashboardController.getDashboardMetrics();

            assertNotNull(responseEntity);
            assertEquals(200, responseEntity.getStatusCode().value());

            Map<?, ?> body = (Map<?, ?>) responseEntity.getBody();
            assertNotNull(body);
            assertTrue((Boolean) body.get("success"));

            EventDashboardMetricsDto data = (EventDashboardMetricsDto) body.get("data");
            assertNotNull(data);
            assertEquals(1L, data.getUpcomingEventsCount());
            
            BigDecimal rev = data.getTotalRevenue();
            BigDecimal pend = data.getPendingPayments();
            assertEquals(0, rev.compareTo(BigDecimal.valueOf(200000)));
            assertEquals(0, pend.compareTo(BigDecimal.valueOf(50000))); // 200000 - 150000 = 50000

            List<?> tasks = data.getTeamTasks();
            assertEquals(1, tasks.size());
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
