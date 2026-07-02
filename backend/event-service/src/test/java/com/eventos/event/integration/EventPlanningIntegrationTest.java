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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

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
public class EventPlanningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventDayRepository eventDayRepository;

    @Autowired
    private EventVenueRepository eventVenueRepository;

    @Autowired
    private TimelineTaskRepository timelineTaskRepository;

    @Autowired
    private EventTimelineItemRepository eventTimelineItemRepository;

    @Autowired
    private TenantSequenceRepository tenantSequenceRepository;

    @MockBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private UUID tenantId;
    private Authentication auth;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        // Setup User Principal & Auth context for OWNER role
        principal = new UserPrincipal(UUID.randomUUID(), tenantId, "owner@eventos.com", "OWNER");
        auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                principal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        // Pre-initialize sequence values to prevent constraints/null failures
        tenantSequenceRepository.saveAndFlush(TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("BOOKING")
                .currentValue(0)
                .build());

        tenantSequenceRepository.saveAndFlush(TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("INVOICE")
                .currentValue(0)
                .build());
    }

    @Test
    void testCreateEventWithDaysAndVenuesAndVerifyTenantIsolation() throws Exception {
        // Construct create request with multiple days and venues
        List<EventDayDto> days = List.of(
                EventDayDto.builder().dayDate(LocalDate.of(2026, 10, 15)).title("Day 1: Setup & Welcome").description("Welcome drinks and setup").build(),
                EventDayDto.builder().dayDate(LocalDate.of(2026, 10, 16)).title("Day 2: Main Ceremony").description("Grand wedding ceremony").build()
        );

        List<EventVenueDto> venues = List.of(
                EventVenueDto.builder().name("Grand Ballroom").address("123 Luxury Way").notes("Main hall for dinner").build(),
                EventVenueDto.builder().name("Garden Lawn").address("123 Luxury Way").notes("Outdoor area for ceremony").build()
        );

        CreateEventDto createEventDto = CreateEventDto.builder()
                .title("Aesthetic Wedding Anniversary")
                .type(EventType.ANNIVERSARY)
                .startDate(LocalDateTime.of(2026, 10, 15, 9, 0))
                .endDate(LocalDateTime.of(2026, 10, 16, 23, 0))
                .location("Luxury Resort")
                .venueName("Grand Ballroom & Garden Lawn")
                .guestCount(150)
                .budget(BigDecimal.valueOf(50000.00))
                .notes("Beautiful floral decoration requested")
                .eventDays(days)
                .eventVenues(venues)
                .build();

        // Perform POST creation
        MvcResult createResult = mockMvc.perform(post("/events")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createEventDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Aesthetic Wedding Anniversary")))
                .andExpect(jsonPath("$.data.eventDays", hasSize(2)))
                .andExpect(jsonPath("$.data.eventVenues", hasSize(2)))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) responseMap.get("data");
        UUID eventId = UUID.fromString((String) dataMap.get("id"));

        // Flush and clear session so child entity eventId column is populated from DB
        entityManager.flush();
        entityManager.clear();

        // Verify EventDays and EventVenues were created in DB with correct tenantId
        List<EventDay> savedDays = eventDayRepository.findAll();
        assertFalse(savedDays.isEmpty());
        for (EventDay day : savedDays) {
            assertEquals(tenantId, day.getTenantId());
            assertEquals(eventId, day.getEventId());
        }

        List<EventVenue> savedVenues = eventVenueRepository.findAll();
        assertFalse(savedVenues.isEmpty());
        for (EventVenue venue : savedVenues) {
            assertEquals(tenantId, venue.getTenantId());
            assertEquals(eventId, venue.getEventId());
        }

        // Verify Tenant Isolation: attempt to get event from a different tenant
        UUID otherTenantId = UUID.randomUUID();
        UserPrincipal otherPrincipal = new UserPrincipal(UUID.randomUUID(), otherTenantId, "other@eventos.com", "OWNER");
        Authentication otherAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                otherPrincipal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));

        mockMvc.perform(get("/events/" + eventId)
                        .with(authentication(otherAuth)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.title", is("BAD_REQUEST")));
    }

    @Test
    void testUpdateEventDaysAndVenues() throws Exception {
        // 1. Create event with initial days and venues
        List<EventDayDto> days = List.of(
                EventDayDto.builder().dayDate(LocalDate.of(2026, 11, 20)).title("Day 1").description("Setup").build()
        );

        List<EventVenueDto> venues = List.of(
                EventVenueDto.builder().name("Poolside").address("Backyard").notes("Cocktails").build()
        );

        CreateEventDto createEventDto = CreateEventDto.builder()
                .name("Corporate Gala")
                .type(EventType.CORPORATE)
                .startDate(LocalDateTime.of(2026, 11, 20, 10, 0))
                .endDate(LocalDateTime.of(2026, 11, 20, 22, 0))
                .eventDays(days)
                .eventVenues(venues)
                .build();

        MvcResult createResult = mockMvc.perform(post("/events")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createEventDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) responseMap.get("data");
        UUID eventId = UUID.fromString((String) dataMap.get("id"));

        // 2. Prepare update payload: Replace day and venue
        List<EventDayDto> updatedDays = List.of(
                EventDayDto.builder().dayDate(LocalDate.of(2026, 11, 20)).title("Main Event Day").description("All presentations").build(),
                EventDayDto.builder().dayDate(LocalDate.of(2026, 11, 21)).title("Networking Day").description("Farewell lunch").build()
        );

        List<EventVenueDto> updatedVenues = List.of(
                EventVenueDto.builder().name("Conference Hall A").address("Main Tower").notes("Presentations").build()
        );

        CreateEventDto updateDto = CreateEventDto.builder()
                .name("Updated Corporate Gala")
                .type(EventType.CORPORATE)
                .startDate(LocalDateTime.of(2026, 11, 20, 9, 0))
                .endDate(LocalDateTime.of(2026, 11, 21, 15, 0))
                .eventDays(updatedDays)
                .eventVenues(updatedVenues)
                .build();

        // Perform PUT update
        mockMvc.perform(put("/events/" + eventId)
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Updated Corporate Gala")))
                .andExpect(jsonPath("$.data.eventDays", hasSize(2)))
                .andExpect(jsonPath("$.data.eventDays[0].title", anyOf(is("Main Event Day"), is("Networking Day"))))
                .andExpect(jsonPath("$.data.eventVenues", hasSize(1)))
                .andExpect(jsonPath("$.data.eventVenues[0].name", is("Conference Hall A")));

        // Flush and clear session so child entity eventId column is populated from DB
        entityManager.flush();
        entityManager.clear();

        // Verify clean replacement in database (orphan removal checks)
        List<EventDay> dbDays = eventDayRepository.findAll();
        assertEquals(2, dbDays.size());
        for (EventDay day : dbDays) {
            assertEquals(eventId, day.getEventId());
            assertEquals(tenantId, day.getTenantId());
        }

        List<EventVenue> dbVenues = eventVenueRepository.findAll();
        assertEquals(1, dbVenues.size());
        assertEquals("Conference Hall A", dbVenues.get(0).getName());
        assertEquals(tenantId, dbVenues.get(0).getTenantId());
    }

    @Test
    void testBookingAssociationBidirectional() throws Exception {
        // 1. Create a dummy event first (needed to satisfy Booking's nullable=false event_id field)
        Event dummyEvent = Event.builder()
                .name("Dummy Event")
                .type(EventType.OTHER)
                .status(EventStatus.PLANNING)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusHours(2))
                .build();
        dummyEvent.setTenantId(tenantId);
        dummyEvent = eventRepository.save(dummyEvent);

        // 2. Create a Booking pointing to the dummy event
        Booking booking = Booking.builder()
                .eventId(dummyEvent.getId())
                .bookingNumber("B-TEST-9981")
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(125000.00))
                .paidAmount(BigDecimal.ZERO)
                .build();
        booking.setTenantId(tenantId);
        booking = bookingRepository.save(booking);

        // 3. Create a new event and associate it with the Booking
        CreateEventDto createEventDto = CreateEventDto.builder()
                .title("Linked Birthday Party")
                .type(EventType.BIRTHDAY)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(5).plusHours(4))
                .bookingId(booking.getId())
                .build();

        MvcResult result = mockMvc.perform(post("/events")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createEventDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.bookingId", is(booking.getId().toString())))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) responseMap.get("data");
        UUID newEventId = UUID.fromString((String) dataMap.get("id"));

        // 4. Verify bidirectional updates
        // Booking should now point to newEventId
        Booking updatedBooking = bookingRepository.findByIdAndTenantId(booking.getId(), tenantId)
                .orElseThrow(() -> new AssertionError("Booking not found"));
        assertEquals(newEventId, updatedBooking.getEventId());

        // Event should point to booking.getId()
        Event updatedEvent = eventRepository.findByIdAndTenantId(newEventId, tenantId)
                .orElseThrow(() -> new AssertionError("Event not found"));
        assertEquals(booking.getId(), updatedEvent.getBookingId());
    }

    @Test
    void testProgressPercentageCalculation() throws Exception {
        // 1. Create event
        CreateEventDto createEventDto = CreateEventDto.builder()
                .title("Progress Tracking Event")
                .type(EventType.SOCIAL)
                .startDate(LocalDateTime.now().plusDays(2))
                .endDate(LocalDateTime.now().plusDays(3))
                .build();

        MvcResult result = mockMvc.perform(post("/events")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createEventDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.progressPercentage", is(0.0)))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) responseMap.get("data");
        UUID eventId = UUID.fromString((String) dataMap.get("id"));

        // 2. Add 2 Timeline Tasks
        CreateTimelineTaskDto task1 = CreateTimelineTaskDto.builder().title("Book Caterer").build();
        CreateTimelineTaskDto task2 = CreateTimelineTaskDto.builder().title("Send Invites").build();

        MvcResult task1Result = mockMvc.perform(post("/events/" + eventId + "/tasks")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(task1)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> t1Map = objectMapper.readValue(task1Result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> t1Data = (Map<?, ?>) t1Map.get("data");
        UUID task1Id = UUID.fromString((String) t1Data.get("id"));

        MvcResult task2Result = mockMvc.perform(post("/events/" + eventId + "/tasks")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(task2)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> t2Map = objectMapper.readValue(task2Result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> t2Data = (Map<?, ?>) t2Map.get("data");
        UUID task2Id = UUID.fromString((String) t2Data.get("id"));

        // 3. Add 1 Timeline Milestone (Run-of-show item)
        CreateTimelineItemDto milestone1 = CreateTimelineItemDto.builder()
                .title("Welcome Guest Speech")
                .scheduledTime(LocalDateTime.now().plusDays(2).plusHours(1))
                .milestone(com.eventos.event.entity.MilestoneType.PLANNING)
                .build();

        MvcResult milestoneResult = mockMvc.perform(post("/events/" + eventId + "/timeline")
                        .with(authentication(auth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(milestone1)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> m1Map = objectMapper.readValue(milestoneResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> m1Data = (Map<?, ?>) m1Map.get("data");
        UUID milestone1Id = UUID.fromString((String) m1Data.get("id"));

        // Total items = 2 Tasks + 1 Milestone = 3.
        // Completed items = 0.
        // Progress = 0%
        mockMvc.perform(get("/events/" + eventId)
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progressPercentage", is(0.0)));

        // 4. Toggle 1 Task to completed.
        // Completed = 1, Total = 3.
        // Progress = 1/3 * 100 = 33.333%
        mockMvc.perform(patch("/events/" + eventId + "/tasks/" + task1Id + "/toggle")
                        .with(authentication(auth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed", is(true)));

        mockMvc.perform(get("/events/" + eventId)
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progressPercentage", closeTo(33.33, 0.1)));

        // 5. Toggle 1 Milestone to completed.
        // Completed = 2, Total = 3.
        // Progress = 2/3 * 100 = 66.666%
        mockMvc.perform(patch("/events/" + eventId + "/timeline/" + milestone1Id + "/toggle")
                        .with(authentication(auth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed", is(true)));

        mockMvc.perform(get("/events/" + eventId)
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progressPercentage", closeTo(66.67, 0.1)));

        // 6. Toggle second Task to completed.
        // Completed = 3, Total = 3.
        // Progress = 100.0%
        mockMvc.perform(patch("/events/" + eventId + "/tasks/" + task2Id + "/toggle")
                        .with(authentication(auth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed", is(true)));

        mockMvc.perform(get("/events/" + eventId)
                        .with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progressPercentage", is(100.0)));
    }
}
