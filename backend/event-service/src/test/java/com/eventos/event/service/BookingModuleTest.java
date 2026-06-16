package com.eventos.event.service;

import com.eventos.event.dto.CreateBookingAssignmentDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingModuleTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingTimelineEventRepository bookingTimelineEventRepository;

    @Mock
    private BookingAuditLogRepository bookingAuditLogRepository;

    @Mock
    private BookingAssignmentRepository bookingAssignmentRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TenantSequenceRepository tenantSequenceRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private BookingService bookingService;

    private UUID tenantId;
    private UUID quoteId;
    private UUID leadId;
    private UUID bookingId;
    private Booking mockBooking;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        quoteId = UUID.randomUUID();
        leadId = UUID.randomUUID();
        bookingId = UUID.randomUUID();

        mockBooking = Booking.builder()
                .id(bookingId)
                .tenantId(tenantId)
                .eventId(UUID.randomUUID())
                .leadId(leadId)
                .quoteId(quoteId)
                .bookingNumber("BK-0002")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(BigDecimal.valueOf(150000))
                .paidAmount(BigDecimal.ZERO)
                .build();

        bookingService.setRestTemplate(restTemplate);
    }

    @Test
    void testGetBookingByQuoteId() {
        when(bookingRepository.findByQuoteIdAndTenantId(quoteId, tenantId))
                .thenReturn(Optional.of(mockBooking));

        Booking result = bookingService.getBookingByQuoteId(quoteId, tenantId);

        assertNotNull(result);
        assertEquals("BK-0002", result.getBookingNumber());
        assertEquals(quoteId, result.getQuoteId());
        verify(bookingRepository, times(1)).findByQuoteIdAndTenantId(quoteId, tenantId);
    }

    @Test
    void testCreateBookingFromQuote_Success() {
        // Mock data for RestTemplate call responses
        Map<String, Object> mockQuoteResponse = new HashMap<>();
        Map<String, Object> quoteData = new HashMap<>();
        quoteData.put("leadId", leadId.toString());
        quoteData.put("total", 150000.0);
        quoteData.put("quoteNumber", "QT-0001");
        quoteData.put("pdfUrl", "http://cloudinary.com/proposals/qt-0001.pdf");
        mockQuoteResponse.put("data", quoteData);

        Map<String, Object> mockLeadResponse = new HashMap<>();
        Map<String, Object> leadData = new HashMap<>();
        leadData.put("name", "Wedding Reception of Alice & Bob");
        leadData.put("eventType", "WEDDING");
        mockLeadResponse.put("data", leadData);

        // Mock eventRepository save
        Event savedEvent = Event.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .name("Wedding Reception of Alice & Bob")
                .type(EventType.WEDDING)
                .status(EventStatus.DRAFT)
                .startDate(LocalDateTime.now().plusDays(30))
                .endDate(LocalDateTime.now().plusDays(30).plusHours(6))
                .build();
        when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

        // Mock sequence number logic
        TenantSequence seq = TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("BOOKING")
                .currentValue(1L)
                .build();
        when(tenantSequenceRepository.findByTenantIdAndSequenceTypeForUpdate(tenantId, "BOOKING"))
                .thenReturn(Optional.of(seq));

        // Mock bookingRepository save
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Stub quote details call
        when(restTemplate.exchange(
                eq("http://localhost:8082/api/v1/crm/quotes/" + quoteId.toString()),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(new ResponseEntity<>(mockQuoteResponse, HttpStatus.OK));

        // Stub lead details call
        when(restTemplate.exchange(
                eq("http://localhost:8082/api/v1/crm/leads/" + leadId.toString()),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(new ResponseEntity<>(mockLeadResponse, HttpStatus.OK));

        Booking bookingResult = bookingService.createBookingFromQuote(quoteId, tenantId);

        assertNotNull(bookingResult);
        assertEquals("BK-0002", bookingResult.getBookingNumber());
        assertEquals(BookingStatus.CONFIRMED, bookingResult.getStatus());
        assertEquals(quoteId, bookingResult.getQuoteId());
        assertEquals(leadId, bookingResult.getLeadId());
        assertEquals(BigDecimal.valueOf(150000.0), bookingResult.getTotalAmount());
        assertEquals("http://cloudinary.com/proposals/qt-0001.pdf", bookingResult.getContractUrl());
        assertEquals(3, bookingResult.getTimelineEvents().size());

        verify(eventRepository, times(1)).save(any(Event.class));
        verify(bookingRepository, times(1)).save(any(Booking.class));
        verify(bookingAuditLogRepository, times(1)).save(any(BookingAuditLog.class));
    }

    @Test
    void testAssignAndRemoveResource() {
        // Arrange
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBooking));

        CreateBookingAssignmentDto assignDto = new CreateBookingAssignmentDto();
        assignDto.setResourceName("Five Star Catering Service");
        assignDto.setResourceType("CATERING");

        BookingAssignment mockAssignment = BookingAssignment.builder()
                .id(UUID.randomUUID())
                .bookingId(bookingId)
                .resourceName("Five Star Catering Service")
                .resourceType("CATERING")
                .build();

        when(bookingAssignmentRepository.save(any(BookingAssignment.class))).thenReturn(mockAssignment);
        when(bookingAssignmentRepository.findById(mockAssignment.getId())).thenReturn(Optional.of(mockAssignment));

        // Act & Assert Resource Assignment
        BookingAssignment assigned = bookingService.assignResource(bookingId, assignDto, tenantId);
        assertNotNull(assigned);
        assertEquals("Five Star Catering Service", assigned.getResourceName());
        assertEquals("CATERING", assigned.getResourceType());
        verify(bookingAssignmentRepository, times(1)).save(any(BookingAssignment.class));
        verify(bookingAuditLogRepository, times(1)).save(any(BookingAuditLog.class));

        // Act & Assert Resource Removal
        bookingService.removeResource(bookingId, mockAssignment.getId(), tenantId);
        verify(bookingAssignmentRepository, times(1)).delete(mockAssignment);
        // There should be a removal audit log
        verify(bookingAuditLogRepository, times(2)).save(any(BookingAuditLog.class));
    }

    @Test
    void testUpdateBookingStatusAndLogAudit() {
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking updated = bookingService.updateBookingStatus(bookingId, BookingStatus.IN_PROGRESS, tenantId);

        assertNotNull(updated);
        assertEquals(BookingStatus.IN_PROGRESS, updated.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
        verify(bookingAuditLogRepository, times(1)).save(any(BookingAuditLog.class));
    }
}
