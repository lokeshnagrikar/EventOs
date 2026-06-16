package com.eventos.event.service;

import com.eventos.event.dto.CreateBookingDto;
import com.eventos.event.dto.CreateBookingTimelineEventDto;
import com.eventos.event.dto.CreateBookingAssignmentDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.BookingTimelineEventRepository;
import com.eventos.event.repository.BookingAuditLogRepository;
import com.eventos.event.repository.BookingAssignmentRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.TenantSequenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Transactional
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final BookingTimelineEventRepository bookingTimelineEventRepository;
    private final BookingAuditLogRepository bookingAuditLogRepository;
    private final BookingAssignmentRepository bookingAssignmentRepository;
    private final EventRepository eventRepository;
    private final TenantSequenceRepository tenantSequenceRepository;
    private RestTemplate restTemplate = new RestTemplate();

    @Value("${service.crm.base-url:http://localhost:8082/api/v1}")
    private String crmServiceBaseUrl;

    public BookingService(BookingRepository bookingRepository,
                          BookingTimelineEventRepository bookingTimelineEventRepository,
                          BookingAuditLogRepository bookingAuditLogRepository,
                          BookingAssignmentRepository bookingAssignmentRepository,
                          EventRepository eventRepository,
                          TenantSequenceRepository tenantSequenceRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingTimelineEventRepository = bookingTimelineEventRepository;
        this.bookingAuditLogRepository = bookingAuditLogRepository;
        this.bookingAssignmentRepository = bookingAssignmentRepository;
        this.eventRepository = eventRepository;
        this.tenantSequenceRepository = tenantSequenceRepository;
    }

    @Transactional(readOnly = true)
    public List<Booking> getAllBookings(UUID tenantId) {
        return bookingRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(UUID id, UUID tenantId) {
        return bookingRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));
    }

    @Transactional(readOnly = true)
    public Booking getBookingByQuoteId(UUID quoteId, UUID tenantId) {
        return bookingRepository.findByQuoteIdAndTenantId(quoteId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));
    }

    public Booking createBooking(CreateBookingDto dto, UUID tenantId) {
        Event event = eventRepository.findByIdAndTenantId(dto.getEventId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Associated event not found or access denied"));

        TenantSequence seq = tenantSequenceRepository
                .findByTenantIdAndSequenceTypeForUpdate(tenantId, "BOOKING")
                .orElse(null);

        long nextVal;
        if (seq == null) {
            seq = TenantSequence.builder()
                    .tenantId(tenantId)
                    .sequenceType("BOOKING")
                    .currentValue(1)
                    .build();
            try {
                seq = tenantSequenceRepository.saveAndFlush(seq);
                nextVal = 1;
            } catch (Exception e) {
                seq = tenantSequenceRepository
                        .findByTenantIdAndSequenceTypeForUpdate(tenantId, "BOOKING")
                        .orElseThrow(() -> new IllegalStateException("Failed to initialize or lock sequence for BOOKING"));
                nextVal = seq.getCurrentValue() + 1;
                seq.setCurrentValue(nextVal);
                tenantSequenceRepository.saveAndFlush(seq);
            }
        } else {
            nextVal = seq.getCurrentValue() + 1;
            seq.setCurrentValue(nextVal);
            tenantSequenceRepository.saveAndFlush(seq);
        }

        String bookingNumber = "BK-" + String.format("%04d", nextVal);

        BookingStatus initialStatus = BookingStatus.PENDING;
        if (dto.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            initialStatus = BookingStatus.CONFIRMED;
        }

        Booking booking = Booking.builder()
                .tenantId(tenantId)
                .eventId(dto.getEventId())
                .leadId(dto.getLeadId())
                .bookingNumber(bookingNumber)
                .status(initialStatus)
                .totalAmount(dto.getTotalAmount())
                .paidAmount(dto.getPaidAmount())
                .contractUrl(dto.getContractUrl())
                .build();

        List<BookingTimelineEvent> milestones = new ArrayList<>();
        boolean advancePaid = dto.getPaidAmount().compareTo(dto.getTotalAmount().multiply(BigDecimal.valueOf(0.5))) >= 0;
        milestones.add(BookingTimelineEvent.builder()
                .title("50% Advance Booking Payment")
                .description("Initial operational reserve lock fee")
                .eventDate(LocalDateTime.now())
                .status(advancePaid ? "COMPLETED" : "PENDING")
                .build());

        boolean contractSigned = dto.getContractUrl() != null && !dto.getContractUrl().isEmpty();
        milestones.add(BookingTimelineEvent.builder()
                .title("Contract Agreement Signature")
                .description("Mutually executed planners contract")
                .eventDate(LocalDateTime.now().plusDays(2))
                .status(contractSigned ? "COMPLETED" : "PENDING")
                .build());

        milestones.add(BookingTimelineEvent.builder()
                .title("Final Balance Settlement")
                .description("25% final settlement payment invoice clearance")
                .eventDate(event.getStartDate() != null ? event.getStartDate().minusDays(1) : LocalDateTime.now().plusDays(29))
                .status("PENDING")
                .build());

        booking.setTimelineEvents(milestones);

        Booking saved = bookingRepository.save(booking);
        
        logAudit(saved.getId(), "CREATED", "Booking locked manually for Event: " + event.getName(), getRequestingUserEmail());
        
        invalidateDashboardCache(tenantId);
        return saved;
    }

    public Booking createBookingFromQuote(UUID quoteId, UUID tenantId) {
        log.info("Provisioning booking from approved Quote ID: {} for Tenant ID: {}", quoteId, tenantId);
        
        org.springframework.web.context.request.ServletRequestAttributes attr = 
            (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        String authHeader = (attr != null) ? attr.getRequest().getHeader("Authorization") : null;

        Map<?, ?> quoteData = null;
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
            headers.set("X-Tenant-ID", tenantId.toString());
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

            org.springframework.http.ResponseEntity<?> response = restTemplate.exchange(
                    "http://localhost:8082/api/v1/crm/quotes/" + quoteId.toString(),
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof Map) {
                quoteData = (Map<?, ?>) ((Map<?, ?>) response.getBody()).get("data");
            }
        } catch (Exception e) {
            log.error("Failed to fetch quote details from crm-service: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to fetch approved quote: " + e.getMessage());
        }

        if (quoteData == null) {
            throw new IllegalArgumentException("Quote details not found in crm-service");
        }

        UUID leadId = UUID.fromString((String) quoteData.get("leadId"));
        BigDecimal total = BigDecimal.valueOf(((Number) quoteData.get("total")).doubleValue());
        String quoteNumber = (String) quoteData.get("quoteNumber");

        Map<?, ?> leadData = null;
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
            headers.set("X-Tenant-ID", tenantId.toString());
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

            org.springframework.http.ResponseEntity<?> response = restTemplate.exchange(
                    "http://localhost:8082/api/v1/crm/leads/" + leadId.toString(),
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof Map) {
                leadData = (Map<?, ?>) ((Map<?, ?>) response.getBody()).get("data");
            }
        } catch (Exception e) {
            log.error("Failed to fetch lead details from crm-service: {}", e.getMessage());
        }

        String leadName = leadData != null ? (String) leadData.get("name") : "Event Workspace (" + quoteNumber + ")";
        String eventTypeStr = leadData != null ? (String) leadData.get("eventType") : "CORPORATE";

        EventType eventType = EventType.CORPORATE;
        try {
            eventType = EventType.valueOf(eventTypeStr.toUpperCase());
        } catch (Exception e) {
            // Default to CORPORATE
        }

        Event event = Event.builder()
                .tenantId(tenantId)
                .name(leadName)
                .type(eventType)
                .status(EventStatus.DRAFT)
                .startDate(LocalDateTime.now().plusDays(30))
                .endDate(LocalDateTime.now().plusDays(30).plusHours(6))
                .budget(total)
                .build();
        event = eventRepository.save(event);

        TenantSequence seq = tenantSequenceRepository
                .findByTenantIdAndSequenceTypeForUpdate(tenantId, "BOOKING")
                .orElse(null);

        long nextVal;
        if (seq == null) {
            seq = TenantSequence.builder()
                    .tenantId(tenantId)
                    .sequenceType("BOOKING")
                    .currentValue(1)
                    .build();
            try {
                seq = tenantSequenceRepository.saveAndFlush(seq);
                nextVal = 1;
            } catch (Exception e) {
                seq = tenantSequenceRepository
                        .findByTenantIdAndSequenceTypeForUpdate(tenantId, "BOOKING")
                        .orElseThrow(() -> new IllegalStateException("Failed to initialize or lock sequence for BOOKING"));
                nextVal = seq.getCurrentValue() + 1;
                seq.setCurrentValue(nextVal);
                tenantSequenceRepository.saveAndFlush(seq);
            }
        } else {
            nextVal = seq.getCurrentValue() + 1;
            seq.setCurrentValue(nextVal);
            tenantSequenceRepository.saveAndFlush(seq);
        }

        String bookingNumber = "BK-" + String.format("%04d", nextVal);

        Booking booking = Booking.builder()
                .tenantId(tenantId)
                .eventId(event.getId())
                .leadId(leadId)
                .quoteId(quoteId)
                .bookingNumber(bookingNumber)
                .status(BookingStatus.CONFIRMED)
                .totalAmount(total)
                .paidAmount(BigDecimal.ZERO)
                .contractUrl((String) quoteData.get("pdfUrl"))
                .build();

        List<BookingTimelineEvent> milestones = new ArrayList<>();
        milestones.add(BookingTimelineEvent.builder()
                .title("50% Advance Booking Payment")
                .description("Initial operational reserve lock fee")
                .eventDate(LocalDateTime.now())
                .status("PENDING")
                .build());

        milestones.add(BookingTimelineEvent.builder()
                .title("Contract Agreement Signature")
                .description("Mutually executed planners contract")
                .eventDate(LocalDateTime.now().plusDays(2))
                .status("COMPLETED")
                .build());

        milestones.add(BookingTimelineEvent.builder()
                .title("Final Balance Settlement")
                .description("25% final settlement payment invoice clearance")
                .eventDate(event.getStartDate() != null ? event.getStartDate().minusDays(1) : LocalDateTime.now().plusDays(29))
                .status("PENDING")
                .build());

        booking.setTimelineEvents(milestones);
        Booking saved = bookingRepository.save(booking);

        logAudit(saved.getId(), "CREATED", "Booking provisioned automatically from approved proposal Quote #" + quoteNumber, getRequestingUserEmail());

        invalidateDashboardCache(tenantId);
        return saved;
    }

    public Booking updateBookingStatus(UUID id, BookingStatus status, UUID tenantId) {
        Booking booking = getBookingById(id, tenantId);
        BookingStatus oldStatus = booking.getStatus();
        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);
        
        logAudit(saved.getId(), "STATUS_CHANGE", "Booking status updated from " + oldStatus + " to " + status, getRequestingUserEmail());
        
        invalidateDashboardCache(tenantId);
        return saved;
    }

    public Booking updatePaidAmount(UUID id, BigDecimal amount, UUID tenantId) {
        Booking booking = getBookingById(id, tenantId);
        BigDecimal oldPaid = booking.getPaidAmount();
        booking.setPaidAmount(amount);

        if (booking.getPaidAmount().compareTo(booking.getTotalAmount()) >= 0) {
            booking.setStatus(BookingStatus.CONFIRMED);
        }

        Booking saved = bookingRepository.save(booking);
        
        logAudit(saved.getId(), "PAYMENT_COLLECTED", "Payment logged. Paid sum updated from INR " + oldPaid + " to INR " + amount, getRequestingUserEmail());
        
        invalidateDashboardCache(tenantId);
        return saved;
    }

    public BookingTimelineEvent addTimelineEvent(UUID bookingId, CreateBookingTimelineEventDto dto, UUID tenantId) {
        getBookingById(bookingId, tenantId);

        BookingTimelineEvent milestone = BookingTimelineEvent.builder()
                .bookingId(bookingId)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .eventDate(dto.getEventDate())
                .status(dto.getStatus())
                .build();

        BookingTimelineEvent saved = bookingTimelineEventRepository.save(milestone);
        
        logAudit(bookingId, "MILESTONE_ADDED", "New timeline milestone added: " + dto.getTitle(), getRequestingUserEmail());
        
        invalidateDashboardCache(tenantId);
        return saved;
    }

    public BookingTimelineEvent toggleTimelineEventStatus(UUID bookingId, UUID milestoneId, UUID tenantId) {
        getBookingById(bookingId, tenantId);

        BookingTimelineEvent milestone = bookingTimelineEventRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Booking milestone not found"));

        if (!milestone.getBookingId().equals(bookingId)) {
            throw new IllegalArgumentException("Milestone does not belong to specified booking");
        }

        String nextStatus = "COMPLETED".equals(milestone.getStatus()) ? "PENDING" : "COMPLETED";
        milestone.setStatus(nextStatus);

        BookingTimelineEvent saved = bookingTimelineEventRepository.save(milestone);
        
        logAudit(bookingId, "MILESTONE_TOGGLE", "Timeline milestone '" + milestone.getTitle() + "' toggled to " + nextStatus, getRequestingUserEmail());
        
        invalidateDashboardCache(tenantId);
        return saved;
    }

    public BookingAssignment assignResource(UUID bookingId, CreateBookingAssignmentDto dto, UUID tenantId) {
        getBookingById(bookingId, tenantId);

        BookingAssignment assignment = BookingAssignment.builder()
                .bookingId(bookingId)
                .resourceName(dto.getResourceName())
                .resourceType(dto.getResourceType())
                .build();

        BookingAssignment saved = bookingAssignmentRepository.save(assignment);
        logAudit(bookingId, "RESOURCE_ASSIGNED", "Assigned resource: " + dto.getResourceName() + " (" + dto.getResourceType() + ")", getRequestingUserEmail());
        return saved;
    }

    public void removeResource(UUID bookingId, UUID resourceId, UUID tenantId) {
        getBookingById(bookingId, tenantId);

        BookingAssignment assignment = bookingAssignmentRepository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("Resource assignment not found"));

        if (!assignment.getBookingId().equals(bookingId)) {
            throw new IllegalArgumentException("Resource assignment does not belong to specified booking");
        }

        bookingAssignmentRepository.delete(assignment);
        logAudit(bookingId, "RESOURCE_REMOVED", "Removed resource: " + assignment.getResourceName(), getRequestingUserEmail());
    }

    @Transactional(readOnly = true)
    public List<BookingAssignment> getResources(UUID bookingId, UUID tenantId) {
        getBookingById(bookingId, tenantId);
        return bookingAssignmentRepository.findAllByBookingIdOrderByAssignedAtDesc(bookingId);
    }

    @Transactional(readOnly = true)
    public List<BookingAuditLog> getAuditLogs(UUID bookingId, UUID tenantId) {
        getBookingById(bookingId, tenantId);
        return bookingAuditLogRepository.findAllByBookingIdOrderByCreatedAtDesc(bookingId);
    }

    private void logAudit(UUID bookingId, String action, String details, String changedBy) {
        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingId(bookingId)
                .action(action)
                .details(details)
                .changedBy(changedBy != null ? changedBy : "SYSTEM")
                .build();
        bookingAuditLogRepository.save(audit);
    }

    private String getRequestingUserEmail() {
        try {
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof com.eventos.event.config.UserPrincipal) {
                return ((com.eventos.event.config.UserPrincipal) auth.getPrincipal()).getEmail();
            }
        } catch (Exception e) {
            // fallback
        }
        return "SYSTEM";
    }

    public void setRestTemplate(org.springframework.web.client.RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private void invalidateDashboardCache(UUID tenantId) {
        if (tenantId == null) return;

        ServletRequestAttributes attr =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String authHeader = (attr != null) ? attr.getRequest().getHeader("Authorization") : null;

        if (authHeader == null || authHeader.isBlank()) {
            log.warn("Skipping dashboard cache invalidation: no auth header in async context");
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", authHeader);
                HttpEntity<Void> entity = new HttpEntity<>(headers);
                restTemplate.exchange(
                    crmServiceBaseUrl + "/crm/dashboard/metrics/cache",
                    HttpMethod.DELETE,
                    entity,
                    Void.class
                );
            } catch (Exception e) {
                log.warn("Failed to invalidate dashboard cache in event-service: {}", e.getMessage());
            }
        });
    }
}
