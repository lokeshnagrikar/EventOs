package com.eventos.event.service;

import com.eventos.event.dto.CreateBookingDto;
import com.eventos.event.dto.CreateBookingTimelineEventDto;
import com.eventos.event.dto.CreateBookingAssignmentDto;
import com.eventos.event.dto.CreateInvoiceDto;
import com.eventos.event.dto.BookingBudgetDto;
import com.eventos.event.entity.*;
import com.eventos.event.event.BookingCancelledEvent;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.BookingTimelineEventRepository;
import com.eventos.event.repository.BookingAuditLogRepository;
import com.eventos.event.repository.BookingAssignmentRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.TenantSequenceRepository;
import com.eventos.event.repository.VendorContractRepository;
import com.eventos.event.repository.ExpenseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.eventos.event.config.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.stream.Stream;
import java.util.Optional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Transactional
@SuppressWarnings({"null", "rawtypes"})
public class BookingService {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.eventos.event.config.DistributedLockService distributedLockService;

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private static final Map<BookingStatus, List<BookingStatus>> VALID_TRANSITIONS = Map.of(
        BookingStatus.PENDING, List.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED),
        BookingStatus.CONFIRMED, List.of(BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED),
        BookingStatus.IN_PROGRESS, List.of(BookingStatus.COMPLETED),
        BookingStatus.COMPLETED, List.of(),
        BookingStatus.CANCELLED, List.of()
    );

    private final BookingRepository bookingRepository;
    private final BookingTimelineEventRepository bookingTimelineEventRepository;
    private final BookingAuditLogRepository bookingAuditLogRepository;
    private final BookingAssignmentRepository bookingAssignmentRepository;
    private final EventRepository eventRepository;
    private final TenantSequenceRepository tenantSequenceRepository;
    private final InvoiceService invoiceService;
    private final VendorContractRepository vendorContractRepository;
    private final ExpenseRepository expenseRepository;
    private final WebClient webClient;
    private final RabbitTemplate rabbitTemplate;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private RestTemplate restTemplate = new RestTemplate();

    @Value("${service.crm.base-url:http://localhost:8082/api/v1}")
    private String crmServiceBaseUrl;

    public BookingService(BookingRepository bookingRepository,
                          BookingTimelineEventRepository bookingTimelineEventRepository,
                          BookingAuditLogRepository bookingAuditLogRepository,
                          BookingAssignmentRepository bookingAssignmentRepository,
                          EventRepository eventRepository,
                          TenantSequenceRepository tenantSequenceRepository,
                          InvoiceService invoiceService,
                          VendorContractRepository vendorContractRepository,
                          ExpenseRepository expenseRepository,
                          RabbitTemplate rabbitTemplate) {
        this.bookingRepository = bookingRepository;
        this.bookingTimelineEventRepository = bookingTimelineEventRepository;
        this.bookingAuditLogRepository = bookingAuditLogRepository;
        this.bookingAssignmentRepository = bookingAssignmentRepository;
        this.eventRepository = eventRepository;
        this.tenantSequenceRepository = tenantSequenceRepository;
        this.invoiceService = invoiceService;
        this.vendorContractRepository = vendorContractRepository;
        this.expenseRepository = expenseRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.webClient = WebClient.builder().build();
    }

    public UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
    }

    public void validateBookingAccess(Booking booking, UserPrincipal principal) {
        if (!booking.getTenantId().equals(principal.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this booking");
        }

        String rolesStr = principal.getRoles();
        if (rolesStr == null || rolesStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: No roles assigned");
        }

        List<String> roles = Stream.of(rolesStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList();

        if (roles.contains("OWNER") || roles.contains("ADMIN")) {
            return;
        }

        if (roles.contains("MANAGER") || roles.contains("STAFF")) {
            boolean assigned = false;
            List<BookingAssignment> assignments = bookingAssignmentRepository.findAllByBookingIdOrderByAssignedAtDesc(booking.getId());
            for (BookingAssignment assignment : assignments) {
                if ("STAFF".equalsIgnoreCase(assignment.getResourceType()) &&
                        (principal.getEmail().equalsIgnoreCase(assignment.getResourceName()) ||
                                principal.getUserId().toString().equalsIgnoreCase(assignment.getResourceName()))) {
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not assigned to this booking");
            }
            return;
        }

        if (roles.contains("CLIENT")) {
            if (booking.getQuoteId() != null) {
                try {
                    String authHeader = getRequestingUserAuthHeader();
                    HttpHeaders headers = new HttpHeaders();
                    if (authHeader != null) {
                        headers.set("Authorization", authHeader);
                    }
                    headers.set("X-Tenant-ID", principal.getTenantId().toString());
                    HttpEntity<Void> entity = new HttpEntity<>(headers);

                    ResponseEntity<Map> response = restTemplate.exchange(
                            crmServiceBaseUrl + "/quotes/" + booking.getQuoteId().toString(),
                            HttpMethod.GET,
                            entity,
                            Map.class);

                    Map<?, ?> responseBody = response.getBody();
                    if (response.getStatusCode().is2xxSuccessful() && responseBody != null) {
                        Map<?, ?> quoteData = (Map<?, ?>) responseBody.get("data");
                        if (quoteData != null) {
                            UUID leadId = UUID.fromString((String) quoteData.get("leadId"));
                            ResponseEntity<Map> leadResponse = restTemplate.exchange(
                                    crmServiceBaseUrl + "/leads/" + leadId.toString(),
                                    HttpMethod.GET,
                                    entity,
                                    Map.class);
                            Map<?, ?> leadResponseBody = leadResponse.getBody();
                            if (leadResponse.getStatusCode().is2xxSuccessful() && leadResponseBody != null) {
                                Map<?, ?> leadData = (Map<?, ?>) leadResponseBody.get("data");
                                if (leadData != null) {
                                    String leadEmail = (String) leadData.get("email");
                                    if (leadEmail != null && leadEmail.equalsIgnoreCase(principal.getEmail())) {
                                        return; // Authorized!
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Client email validation failed via quote/lead: {}", e.getMessage());
                }
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Booking is not linked to your email");
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Unknown role");
    }

    private String getRequestingUserAuthHeader() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attr =
                (org.springframework.web.context.request.ServletRequestAttributes)
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attr != null) return attr.getRequest().getHeader("Authorization");
        } catch (Exception ignored) {}
        return null;
    }

    @Transactional(readOnly = true)
    public List<Booking> getAllBookings(UUID tenantId) {
        UserPrincipal principal = getCurrentUser();
        List<Booking> allBookings = bookingRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);

        List<String> roles = Stream.of(principal.getRoles().split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList();

        if (roles.contains("OWNER") || roles.contains("ADMIN")) {
            return allBookings;
        }

        List<Booking> filtered = new ArrayList<>();
        for (Booking booking : allBookings) {
            try {
                validateBookingAccess(booking, principal);
                filtered.add(booking);
            } catch (ResponseStatusException e) {
                // skip
            }
        }
        return filtered;
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(UUID id, UUID tenantId) {
        Booking booking = bookingRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));
        validateBookingAccess(booking, getCurrentUser());
        return booking;
    }

    @Transactional(readOnly = true)
    public Booking getBookingByQuoteId(UUID quoteId, UUID tenantId) {
        Booking booking = bookingRepository.findByQuoteIdAndTenantId(quoteId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));
        validateBookingAccess(booking, getCurrentUser());
        return booking;
    }

    public Booking createBooking(CreateBookingDto dto, UUID tenantId) {
        String lockKey = "lock:booking:event:" + dto.getEventId().toString();
        if (distributedLockService != null && !distributedLockService.acquireLock(lockKey, Duration.ofSeconds(10))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another booking request for this event is currently in progress. Please try again.");
        }
        try {
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

            int currentYear = java.time.LocalDate.now().getYear();
            String bookingNumber = "EVT-" + currentYear + "-" + String.format("%06d", nextVal);

            BookingStatus initialStatus = BookingStatus.PENDING;
            if (dto.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                initialStatus = BookingStatus.CONFIRMED;
            }

            Booking booking = Booking.builder()
                    .eventId(dto.getEventId())
                    .leadId(dto.getLeadId())
                    .bookingNumber(bookingNumber)
                    .status(initialStatus)
                    .totalAmount(dto.getTotalAmount())
                    .paidAmount(dto.getPaidAmount())
                    .contractUrl(dto.getContractUrl())
                    .build();
            booking.setTenantId(tenantId);

            List<BookingTimelineEvent> milestones = new ArrayList<>();
            boolean advancePaid = dto.getPaidAmount().compareTo(dto.getTotalAmount().multiply(BigDecimal.valueOf(0.5))) >= 0;
            milestones.add(BookingTimelineEvent.builder()
                    .tenantId(tenantId)
                    .title("50% Advance Booking Payment")
                    .description("Initial operational reserve lock fee")
                    .eventDate(LocalDateTime.now())
                    .status(advancePaid ? "COMPLETED" : "PENDING")
                    .build());

            boolean contractSigned = dto.getContractUrl() != null && !dto.getContractUrl().isEmpty();
            milestones.add(BookingTimelineEvent.builder()
                    .tenantId(tenantId)
                    .title("Contract Agreement Signature")
                    .description("Mutually executed planners contract")
                    .eventDate(LocalDateTime.now().plusDays(2))
                    .status(contractSigned ? "COMPLETED" : "PENDING")
                    .build());

            milestones.add(BookingTimelineEvent.builder()
                    .tenantId(tenantId)
                    .title("Final Balance Settlement")
                    .description("25% final settlement payment invoice clearance")
                    .eventDate(event.getStartDate() != null ? event.getStartDate().minusDays(1) : LocalDateTime.now().plusDays(29))
                    .status("PENDING")
                    .build());

            for (BookingTimelineEvent milestone : milestones) {
                milestone.setTenantId(tenantId);
            }
            booking.setTimelineEvents(milestones);

            Booking saved = bookingRepository.save(booking);
            
            logAudit(saved.getId(), saved.getTenantId(), "CREATED", "Booking locked manually for Event: " + event.getName(), getRequestingUserEmail());
            
            invalidateDashboardCache(tenantId);
            return saved;
        } finally {
            if (distributedLockService != null) {
                distributedLockService.releaseLock(lockKey);
            }
        }
    }

    public Booking createBookingFromQuote(UUID quoteId, UUID tenantId) {
        Optional<Booking> existingBooking = bookingRepository.findByQuoteIdAndTenantId(quoteId, tenantId);
        if (existingBooking.isPresent()) {
            log.warn("Booking for Quote ID {} already exists. Skipping creation.", quoteId);
            return existingBooking.get();
        }
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
                    crmServiceBaseUrl + "/quotes/" + quoteId.toString(),
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof Map) {
                quoteData = (Map<?, ?>) ((Map<?, ?>) response.getBody()).get("data");
            }
        } catch (org.springframework.web.client.HttpClientErrorException.Forbidden e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access to quote is denied");
        } catch (Exception e) {
            log.error("Failed to fetch quote details from crm-service: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to fetch approved quote: " + e.getMessage());
        }

        if (quoteData == null) {
            throw new IllegalArgumentException("Quote details not found in crm-service");
        }

        // Validate Quote status is exactly ACCEPTED
        String quoteStatusStr = (String) quoteData.get("status");
        if (quoteStatusStr == null || !quoteStatusStr.equalsIgnoreCase("ACCEPTED")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Quote must be in ACCEPTED status to convert to a booking. Current status: " + quoteStatusStr);
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
                    crmServiceBaseUrl + "/leads/" + leadId.toString(),
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() instanceof Map) {
                leadData = (Map<?, ?>) ((Map<?, ?>) response.getBody()).get("data");
            }
        } catch (org.springframework.web.client.HttpClientErrorException.Forbidden e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access to lead is denied");
        } catch (Exception e) {
            log.error("Failed to fetch lead details from crm-service: {}", e.getMessage());
        }

        if (leadData == null) {
            throw new IllegalArgumentException("Lead details not found in crm-service");
        }

        UUID clientId = null;
        String clientName = null;
        String clientEmail = null;
        String clientPhone = null;
        if (leadData.get("contact") instanceof Map<?, ?> contactMap) {
            Object idVal = contactMap.get("id");
            if (idVal != null) {
                clientId = UUID.fromString(idVal.toString());
            }
            String firstName = (String) contactMap.get("firstName");
            String lastName = (String) contactMap.get("lastName");
            if (firstName != null) {
                clientName = firstName + (lastName != null && !lastName.isEmpty() ? " " + lastName : "");
            }
            clientEmail = (String) contactMap.get("email");
            clientPhone = (String) contactMap.get("phone");
        }

        // Retrieve planned event date from CRM lead data
        String eventDateStr = (String) leadData.get("eventDate");
        if (eventDateStr == null || eventDateStr.isEmpty()) {
            throw new IllegalArgumentException("CRM Lead does not have a planned event date");
        }

        java.time.LocalDate eventDate = java.time.LocalDate.parse(eventDateStr);
        LocalDateTime eventStartDate = eventDate.atStartOfDay();
        LocalDateTime eventEndDate = eventStartDate.plusHours(6);

        String leadName = (String) leadData.get("name");
        if (leadName == null || leadName.isEmpty()) {
            leadName = "Event Workspace (" + quoteNumber + ")";
        }
        String eventTypeStr = (String) leadData.get("eventType");

        EventType eventType = EventType.CORPORATE;
        try {
            if (eventTypeStr != null) {
                eventType = EventType.valueOf(eventTypeStr.toUpperCase());
            }
        } catch (Exception e) {
            // Default to CORPORATE
        }

        Event event = Event.builder()
                .name(leadName)
                .type(eventType)
                .status(EventStatus.PLANNING)
                .startDate(eventStartDate)
                .endDate(eventEndDate)
                .budget(total)
                .build();
        event.setTenantId(tenantId);
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

        int currentYear = java.time.LocalDate.now().getYear();
        String bookingNumber = "EVT-" + currentYear + "-" + String.format("%06d", nextVal);

        Booking booking = Booking.builder()
                .eventId(event.getId())
                .leadId(leadId)
                .quoteId(quoteId)
                .clientId(clientId)
                .clientName(clientName)
                .clientEmail(clientEmail)
                .clientPhone(clientPhone)
                .eventType(eventTypeStr)
                .bookingNumber(bookingNumber)
                .status(BookingStatus.PENDING)
                .totalAmount(total)
                .paidAmount(BigDecimal.ZERO)
                .contractUrl((String) quoteData.get("pdfUrl"))
                .build();
        booking.setTenantId(tenantId);

        List<BookingTimelineEvent> milestones = new ArrayList<>();
        milestones.add(BookingTimelineEvent.builder()
                .tenantId(tenantId)
                .title("50% Advance Booking Payment")
                .description("Initial operational reserve lock fee")
                .eventDate(LocalDateTime.now())
                .status("PENDING")
                .build());

        milestones.add(BookingTimelineEvent.builder()
                .tenantId(tenantId)
                .title("Contract Agreement Signature")
                .description("Mutually executed planners contract")
                .eventDate(LocalDateTime.now().plusDays(2))
                .status("COMPLETED")
                .build());

        milestones.add(BookingTimelineEvent.builder()
                .tenantId(tenantId)
                .title("Final Balance Settlement")
                .description("25% final settlement payment invoice clearance")
                .eventDate(event.getStartDate() != null ? event.getStartDate().minusDays(1) : LocalDateTime.now().plusDays(29))
                .status("PENDING")
                .build());

        for (BookingTimelineEvent milestone : milestones) {
            milestone.setTenantId(tenantId);
        }
        booking.setTimelineEvents(milestones);
        Booking saved = bookingRepository.save(booking);

        logAudit(saved.getId(), saved.getTenantId(), "CREATED", "Booking provisioned automatically from approved proposal Quote #" + quoteNumber, getRequestingUserEmail());

        invalidateDashboardCache(tenantId);
        return saved;
    }

    public Booking updateBookingStatus(UUID id, BookingStatus status, UUID tenantId) {
        Booking booking = getBookingById(id, tenantId);
        BookingStatus oldStatus = booking.getStatus();
        
        if (oldStatus == status) {
            return booking;
        }

        List<BookingStatus> allowed = VALID_TRANSITIONS.get(oldStatus);
        if (allowed == null || !allowed.contains(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Transition from " + oldStatus + " to " + status + " is not allowed");
        }

        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);
        
        logAudit(saved.getId(), saved.getTenantId(), "STATUS_CHANGE", "Booking status updated from " + oldStatus + " to " + status, getRequestingUserEmail());
        
        if (status == BookingStatus.CANCELLED) {
            try {
                BookingCancelledEvent event = BookingCancelledEvent.builder()
                        .bookingId(saved.getId())
                        .tenantId(tenantId)
                        .eventId(saved.getEventId())
                        .bookingNumber(saved.getBookingNumber())
                        .cancelledAt(LocalDateTime.now())
                        .reason("Booking status transitioned to CANCELLED")
                        .build();
                rabbitTemplate.convertAndSend("eventos.exchange", "booking.cancelled", event);
                log.info("Published BookingCancelledEvent for Booking ID: {}", saved.getId());
            } catch (Exception e) {
                log.error("Failed to publish BookingCancelledEvent for Booking ID: {}", saved.getId(), e);
            }
        }
        
        invalidateDashboardCache(tenantId);
        return saved;
    }

    public Booking updatePaidAmount(UUID id, BigDecimal amount, UUID tenantId) {
        Booking booking = getBookingById(id, tenantId);
        BigDecimal oldPaid = booking.getPaidAmount();
        booking.setPaidAmount(amount);

        // Auto-promote to CONFIRMED only when:
        // - current status is PENDING
        // - paidAmount > 0
        if (booking.getStatus() == BookingStatus.PENDING && booking.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            booking.setStatus(BookingStatus.CONFIRMED);
            logAudit(booking.getId(), booking.getTenantId(), "STATUS_CHANGE", "Booking status auto-promoted from PENDING to CONFIRMED due to payment", "SYSTEM");
        }

        Booking saved = bookingRepository.save(booking);
        
        logAudit(saved.getId(), saved.getTenantId(), "PAYMENT_COLLECTED", "Payment logged. Paid sum updated from INR " + oldPaid + " to INR " + amount, getRequestingUserEmail());
        
        invalidateDashboardCache(tenantId);
        return saved;
    }

    public BookingTimelineEvent addTimelineEvent(UUID bookingId, CreateBookingTimelineEventDto dto, UUID tenantId) {
        getBookingById(bookingId, tenantId);

        BookingTimelineEvent milestone = BookingTimelineEvent.builder()
                .bookingId(bookingId)
                .tenantId(tenantId)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .eventDate(dto.getEventDate())
                .status(dto.getStatus())
                .build();

        milestone.setTenantId(tenantId);

        BookingTimelineEvent saved = bookingTimelineEventRepository.save(milestone);
        
        logAudit(bookingId, tenantId, "MILESTONE_ADDED", "New timeline milestone added: " + dto.getTitle(), getRequestingUserEmail());
        
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
        
        logAudit(bookingId, tenantId, "MILESTONE_TOGGLE", "Timeline milestone '" + milestone.getTitle() + "' toggled to " + nextStatus, getRequestingUserEmail());
        
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
        logAudit(bookingId, tenantId, "RESOURCE_ASSIGNED", "Assigned resource: " + dto.getResourceName() + " (" + dto.getResourceType() + ")", getRequestingUserEmail());
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
        logAudit(bookingId, tenantId, "RESOURCE_REMOVED", "Removed resource: " + assignment.getResourceName(), getRequestingUserEmail());
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

    private void logAudit(UUID bookingId, UUID tenantId, String action, String details, String changedBy) {
        if (tenantId == null) {
            tenantId = com.eventos.event.config.TenantContext.getTenantId();
        }
        if (tenantId == null) {
            try {
                org.springframework.security.core.Authentication auth = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof com.eventos.event.config.UserPrincipal principal) {
                    tenantId = principal.getTenantId();
                }
            } catch (Exception ignored) {}
        }
        if (tenantId == null) {
            tenantId = bookingRepository.findById(bookingId)
                    .map(Booking::getTenantId)
                    .orElse(null);
        }

        BookingAuditLog audit = BookingAuditLog.builder()
                .bookingId(bookingId)
                .action(action)
                .details(details)
                .changedBy(changedBy != null ? changedBy : "SYSTEM")
                .build();
        audit.setTenantId(tenantId);
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
            log.warn("Skipping dashboard cache invalidation: no auth header in request context");
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                webClient.delete()
                    .uri(crmServiceBaseUrl + "/dashboard/metrics/cache")
                    .header("Authorization", authHeader)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            } catch (Exception e) {
                log.warn("Failed to invalidate dashboard cache in event-service via WebClient: {}", e.getMessage());
            }
        });
    }

    @Transactional
    public Booking createBookingFromQuoteEvent(com.eventos.event.event.QuoteAcceptedEvent event) {
        UUID tenantId = event.getTenantId();
        Optional<Booking> existingBooking = bookingRepository.findByQuoteIdAndTenantId(event.getQuoteId(), tenantId);
        if (existingBooking.isPresent()) {
            log.warn("Booking for Quote ID {} already exists. Skipping creation.", event.getQuoteId());
            return existingBooking.get();
        }
        log.info("Provisioning booking from approved QuoteAcceptedEvent for Quote ID: {} for Tenant ID: {}", event.getQuoteId(), event.getTenantId());
        
        UUID leadId = event.getLeadId();
        BigDecimal total = event.getTotalAmount();
        String quoteNumber = event.getQuoteNumber();
        String contractUrl = event.getContractUrl();
        
        String eventDateStr = event.getEventDate();
        if (eventDateStr == null || eventDateStr.isEmpty()) {
            throw new IllegalArgumentException("CRM Lead does not have a planned event date");
        }
        
        java.time.LocalDate eventDate = java.time.LocalDate.parse(eventDateStr);
        LocalDateTime eventStartDate = eventDate.atStartOfDay();
        LocalDateTime eventEndDate = eventStartDate.plusHours(6);
        
        String leadName = event.getClientName() != null ? event.getClientName() : "Event Workspace (" + quoteNumber + ")";
        String eventTypeStr = event.getEventType();
        
        EventType eventType = EventType.CORPORATE;
        try {
            if (eventTypeStr != null) {
                eventType = EventType.valueOf(eventTypeStr.toUpperCase());
            }
        } catch (IllegalArgumentException e) {
            log.warn("Invalid event type received from CRM: {}. Defaulting to CORPORATE.", eventTypeStr);
        }
        
        Event eventEntity = Event.builder()
                .name(leadName)
                .type(eventType)
                .status(EventStatus.PLANNING)
                .startDate(eventStartDate)
                .endDate(eventEndDate)
                .build();
        eventEntity.setTenantId(tenantId);
                
        Event savedEvent = eventRepository.save(eventEntity);
        log.info("Provisioned Event for Booking. Event ID: {}", savedEvent.getId());
        
        // Lock sequence and generate booking number
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
        
        int currentYear = java.time.LocalDate.now().getYear();
        String bookingNumber = "EVT-" + currentYear + "-" + String.format("%06d", nextVal);
        
        Booking booking = Booking.builder()
                .eventId(savedEvent.getId())
                .leadId(leadId)
                .quoteId(event.getQuoteId())
                .clientId(event.getClientId())
                .clientName(event.getClientName())
                .clientEmail(event.getClientEmail())
                .clientPhone(event.getClientPhone())
                .eventType(event.getEventType())
                .bookingNumber(bookingNumber)
                .status(BookingStatus.PENDING)
                .totalAmount(total)
                .paidAmount(BigDecimal.ZERO)
                .contractUrl(contractUrl)
                .build();
        booking.setTenantId(tenantId);
                
        List<BookingTimelineEvent> milestones = new ArrayList<>();
        milestones.add(BookingTimelineEvent.builder()
                .tenantId(tenantId)
                .title("50% Advance Booking Payment")
                .description("Initial operational reserve lock fee")
                .eventDate(LocalDateTime.now())
                .status("PENDING")
                .build());
                
        milestones.add(BookingTimelineEvent.builder()
                .tenantId(tenantId)
                .title("Contract Agreement Signature")
                .description("Mutually executed planners contract")
                .eventDate(LocalDateTime.now().plusDays(2))
                .status("COMPLETED")
                .build());
                
        milestones.add(BookingTimelineEvent.builder()
                .tenantId(tenantId)
                .title("Final Balance Settlement")
                .description("25% final settlement payment invoice clearance")
                .eventDate(savedEvent.getStartDate() != null ? savedEvent.getStartDate().minusDays(1) : LocalDateTime.now().plusDays(29))
                .status("PENDING")
                .build());
                
        for (BookingTimelineEvent milestone : milestones) {
            milestone.setTenantId(tenantId);
        }
        booking.setTimelineEvents(milestones);
        Booking savedBooking = bookingRepository.save(booking);
        
        logAudit(savedBooking.getId(), savedBooking.getTenantId(), "CREATED", "Booking provisioned automatically from approved proposal Quote #" + quoteNumber, "SYSTEM");
        
        // Auto-create invoice
        try {
            CreateInvoiceDto invoiceDto = CreateInvoiceDto.builder()
                    .bookingId(savedBooking.getId())
                    .subtotal(total)
                    .tax(BigDecimal.ZERO)
                    .discount(BigDecimal.ZERO)
                    .dueDate(savedEvent.getStartDate() != null ? savedEvent.getStartDate().minusDays(1) : LocalDateTime.now().plusDays(14))
                    .clientName(event.getClientName() != null && !event.getClientName().isEmpty() ? event.getClientName() : "Client for Quote #" + quoteNumber)
                    .clientEmail(event.getClientEmail())
                    .billingAddress("")
                    .notes("Invoice auto-generated from approved proposal Quote #" + quoteNumber)
                    .build();
            invoiceService.createInvoice(invoiceDto, tenantId);
            log.info("Invoice auto-created for Booking ID: {}", savedBooking.getId());
        } catch (Exception e) {
            log.error("Failed to auto-create invoice for Booking ID: {}", savedBooking.getId(), e);
        }

        // Publish BookingCreatedEvent
        try {
            com.eventos.event.event.BookingCreatedEvent createdEvent = com.eventos.event.event.BookingCreatedEvent.builder()
                    .bookingId(savedBooking.getId())
                    .tenantId(tenantId)
                    .leadId(leadId)
                    .eventId(savedEvent.getId())
                    .bookingNumber(savedBooking.getBookingNumber())
                    .totalAmount(savedBooking.getTotalAmount())
                    .clientName(event.getClientName())
                    .clientEmail(event.getClientEmail())
                    .eventType(event.getEventType())
                    .build();
            rabbitTemplate.convertAndSend("eventos.exchange", "booking.created", createdEvent);
            log.info("Published BookingCreatedEvent for Booking ID: {}", savedBooking.getId());
        } catch (Exception e) {
            log.error("Failed to publish BookingCreatedEvent for Booking ID: {}", savedBooking.getId(), e);
        }

        invalidateDashboardCache(tenantId);
        return savedBooking;
    }

    @Transactional(readOnly = true)
    public BookingBudgetDto getBookingBudget(UUID bookingId, UUID tenantId) {
        Booking booking = getBookingById(bookingId, tenantId);
        List<VendorContract> contracts = vendorContractRepository.findAllByBookingIdAndTenantId(bookingId, tenantId);

        BigDecimal revenue = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal estimatedCost = BigDecimal.ZERO;
        BigDecimal actualCost = BigDecimal.ZERO;

        for (VendorContract contract : contracts) {
            if (!"CANCELLED".equals(contract.getStatus())) {
                estimatedCost = estimatedCost.add(contract.getTotalCost() != null ? contract.getTotalCost() : BigDecimal.ZERO);
                actualCost = actualCost.add(contract.getActualCost() != null ? contract.getActualCost() : BigDecimal.ZERO);
            }
        }

        List<Expense> expenses = expenseRepository.findAllByBookingIdAndTenantIdOrderByExpenseDateDesc(bookingId, tenantId);
        for (Expense exp : expenses) {
            if (exp.getVendorContractId() == null) {
                actualCost = actualCost.add(exp.getAmount() != null ? exp.getAmount() : BigDecimal.ZERO);
            }
        }

        BigDecimal profitMargin = revenue.subtract(actualCost);
        BigDecimal profitMarginPercentage = BigDecimal.ZERO;
        if (revenue.compareTo(BigDecimal.ZERO) > 0) {
            profitMarginPercentage = profitMargin.divide(revenue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return BookingBudgetDto.builder()
                .revenue(revenue)
                .estimatedCost(estimatedCost)
                .actualCost(actualCost)
                .profitMargin(profitMargin)
                .profitMarginPercentage(profitMarginPercentage)
                .build();
    }
}

