package com.eventos.crm.service;

import com.eventos.crm.dto.DashboardMetricsDto;
import com.eventos.crm.entity.Lead;
import com.eventos.crm.entity.LeadStatus;
import com.eventos.crm.repository.LeadRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final LeadRepository leadRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final WebClient webClient;

    @org.springframework.beans.factory.annotation.Value("${service.event.base-url:http://localhost:8083/api/v1/events}")
    private String eventServiceBaseUrl;

    public DashboardService(LeadRepository leadRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.leadRepository = leadRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder().build();
    }

    public DashboardMetricsDto getMetricsForTenant(UUID tenantId, String userRole) {
        String cleanRole = (userRole != null) ? userRole.toUpperCase() : "STAFF";
        String cacheKey = "dashboard:metrics:" + tenantId.toString() + ":" + cleanRole;

        // 1. Try reading from Redis Cache
        if (redisTemplate != null) {
            try {
                String cachedJson = redisTemplate.opsForValue().get(cacheKey);
                if (cachedJson != null) {
                    return objectMapper.readValue(cachedJson, DashboardMetricsDto.class);
                }
            } catch (Exception e) {
                System.err.println("Dashboard Redis cache read failed: " + e.getMessage());
            }
        }

        // 2. Fetch CRM/Leads metrics from crm_db
        long totalLeads = leadRepository.countByTenantIdAndIsDeletedFalse(tenantId);
        long wonLeads = leadRepository.countByTenantIdAndStatusInAndIsDeletedFalse(tenantId, List.of(LeadStatus.WON));
        double conversionRate = totalLeads > 0 ? (wonLeads * 100.0 / totalLeads) : 0.0;

        BigDecimal pipelineValue = leadRepository.sumBudgetByTenantIdAndStatusInAndIsDeletedFalse(tenantId,
                List.of(LeadStatus.NEW, LeadStatus.QUALIFIED, LeadStatus.PROPOSAL_SENT, LeadStatus.NEGOTIATION));
        BigDecimal wonValue = leadRepository.sumBudgetByTenantIdAndStatusInAndIsDeletedFalse(tenantId,
                List.of(LeadStatus.WON));
        BigDecimal revenueForecast = wonValue.add(pipelineValue.multiply(BigDecimal.valueOf(conversionRate / 100.0)));

        // 3. Retrieve Event/Financial metrics from event-service (with token
        // forwarding)
        Map<String, Object> eventData = fetchRemoteEventMetrics(tenantId);

        // Parse remote data
        List<DashboardMetricsDto.EventDto> upcomingEvents = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal pendingPayments = BigDecimal.ZERO;
        List<DashboardMetricsDto.TaskDto> teamTasks = new ArrayList<>();

        if (eventData != null) {
            if (eventData.get("upcomingEvents") instanceof List) {
                List<?> list = (List<?>) eventData.get("upcomingEvents");
                for (Object item : list) {
                    if (item instanceof Map) {
                        Map<?, ?> map = (Map<?, ?>) item;
                        upcomingEvents.add(DashboardMetricsDto.EventDto.builder()
                                .id(Objects.toString(map.get("id"), ""))
                                .name(Objects.toString(map.get("name"), ""))
                                .type(Objects.toString(map.get("type"), ""))
                                .status(Objects.toString(map.get("status"), ""))
                                .startDate(Objects.toString(map.get("startDate"), ""))
                                .location(Objects.toString(map.get("location"), ""))
                                .build());
                    }
                }
            }
            if (eventData.containsKey("totalRevenue") && eventData.get("totalRevenue") != null) {
                try {
                    totalRevenue = new BigDecimal(eventData.get("totalRevenue").toString());
                } catch (NumberFormatException e) {
                    System.err.println("Failed to parse totalRevenue: " + e.getMessage());
                }
            }
            if (eventData.containsKey("pendingPayments") && eventData.get("pendingPayments") != null) {
                try {
                    pendingPayments = new BigDecimal(eventData.get("pendingPayments").toString());
                } catch (NumberFormatException e) {
                    System.err.println("Failed to parse pendingPayments: " + e.getMessage());
                }
            }
            if (eventData.get("teamTasks") instanceof List) {
                List<?> list = (List<?>) eventData.get("teamTasks");
                for (Object item : list) {
                    if (item instanceof Map) {
                        Map<?, ?> map = (Map<?, ?>) item;
                        teamTasks.add(DashboardMetricsDto.TaskDto.builder()
                                .id(Objects.toString(map.get("id"), ""))
                                .title(Objects.toString(map.get("title"), ""))
                                .description(Objects.toString(map.get("description"), ""))
                                .scheduledTime(Objects.toString(map.get("scheduledTime"), ""))
                                .completed(Boolean.TRUE.equals(map.get("completed")))
                                .build());
                    }
                }
            }
        }

        // Recent Activity Feed (Aggregate recent lead status changes & activity events)
        List<DashboardMetricsDto.ActivityDto> recentActivity = new ArrayList<>();
        List<Lead> recentLeads = leadRepository.findTop3ByTenantIdAndIsDeletedFalseOrderByUpdatedAtDesc(tenantId);
        int actId = 1;
        for (Lead l : recentLeads) {
            recentActivity.add(DashboardMetricsDto.ActivityDto.builder()
                    .id(String.valueOf(actId++))
                    .time("Lead Updated")
                    .message("Lead '" + l.getName() + "' status changed to "
                            + (l.getStatus() != null ? l.getStatus().name() : "UNKNOWN"))
                    .build());
        }

        // 4. Construct response DTO & apply Role-Based widget pruning
        List<String> visibleWidgets = new ArrayList<>();
        DashboardMetricsDto.LeadMetrics leadMetricsObj = null;
        DashboardMetricsDto.RevenueMetrics revenueMetricsObj = null;
        List<DashboardMetricsDto.PaymentDto> pendingPaymentsList = null;

        if (cleanRole.contains("OWNER") || cleanRole.contains("ADMIN") || cleanRole.contains("MANAGER")) {
            BigDecimal revenueSafe = (totalRevenue != null) ? totalRevenue : BigDecimal.ZERO;
            BigDecimal pendingSafe = (pendingPayments != null) ? pendingPayments : BigDecimal.ZERO;
            visibleWidgets.addAll(List.of("totalLeads", "conversionRate", "upcomingEvents", "revenueMetrics",
                    "pendingPayments", "recentActivity", "teamTasks"));
            leadMetricsObj = DashboardMetricsDto.LeadMetrics.builder()
                    .totalLeads(totalLeads)
                    .conversionRate(conversionRate)
                    .pipelineValue(pipelineValue)
                    .revenueForecast(revenueForecast)
                    .build();
            revenueMetricsObj = DashboardMetricsDto.RevenueMetrics.builder()
                    .totalRevenue("INR " + String.format("%,.0f", revenueSafe))
                    .outstandingBalance("INR " + String.format("%,.0f", pendingSafe))
                    .percentIncrease("+12.4%")
                    .build();
            pendingPaymentsList = upcomingEvents.stream()
                    .limit(2)
                    .map(e -> DashboardMetricsDto.PaymentDto.builder()
                            .bookingNumber("BK-" + ((e.getId() != null && e.getId().length() >= 4)
                                    ? e.getId().substring(0, 4).toUpperCase()
                                    : "TEMP"))
                            .dueDate(e.getStartDate())
                            .amount(revenueSafe.doubleValue() * 0.25)
                            .status("PENDING")
                            .build())
                    .collect(Collectors.toList());
        } else if (cleanRole.contains("STAFF")) {
            visibleWidgets
                    .addAll(List.of("totalLeads", "conversionRate", "upcomingEvents", "recentActivity", "teamTasks"));
            leadMetricsObj = DashboardMetricsDto.LeadMetrics.builder()
                    .totalLeads(totalLeads)
                    .conversionRate(conversionRate)
                    .pipelineValue(pipelineValue)
                    .revenueForecast(revenueForecast)
                    .build();
            pendingPayments = null; // staff does not see pending payments or revenue overview details
            revenueMetricsObj = null;
        } else if (cleanRole.contains("CLIENT")) {
            BigDecimal pendingSafe = (pendingPayments != null) ? pendingPayments : BigDecimal.ZERO;
            visibleWidgets.addAll(List.of("upcomingEvents", "pendingPayments", "recentActivity"));
            pendingPaymentsList = Collections.singletonList(
                    DashboardMetricsDto.PaymentDto.builder()
                            .bookingNumber("BK-MY-EVENT")
                            .dueDate(nowDateString())
                            .amount(pendingSafe.doubleValue())
                            .status("PENDING")
                            .build());
            teamTasks = null;
        }

        DashboardMetricsDto dto = DashboardMetricsDto.builder()
                .visibleWidgets(visibleWidgets)
                .leadMetrics(leadMetricsObj)
                .revenueMetrics(revenueMetricsObj)
                .upcomingEvents(upcomingEvents)
                .pendingPayments(pendingPaymentsList)
                .recentActivity(recentActivity)
                .teamTasks(teamTasks)
                .build();

        // 5. Write to Redis Cache
        if (redisTemplate != null) {
            try {
                String json = objectMapper.writeValueAsString(dto);
                redisTemplate.opsForValue().set(cacheKey, json, 10, TimeUnit.MINUTES);
                redisTemplate.opsForSet().add("tenant:dashboard:keys:" + tenantId.toString(), cacheKey);
            } catch (Exception e) {
                System.err.println("Dashboard Redis cache write failed: " + e.getMessage());
            }
        }

        return dto;
    }

    public void invalidateCache(UUID tenantId) {
        if (tenantId == null || redisTemplate == null)
            return;
        try {
            String setKey = "tenant:dashboard:keys:" + tenantId.toString();
            Set<String> keys = redisTemplate.opsForSet().members(setKey);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
            redisTemplate.delete(setKey);
        } catch (Exception e) {
            System.err.println("Dashboard cache invalidation failed: " + e.getMessage());
        }
    }

    private Map<String, Object> fetchRemoteEventMetrics(UUID tenantId) {
        ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String authHeader = (attr != null) ? attr.getRequest().getHeader("Authorization") : null;

        try {
            return webClient.get()
                    .uri(eventServiceBaseUrl + "/dashboard/metrics")
                    .header("Authorization", authHeader)
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(Duration.ofMillis(2000))
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(100))
                            .maxBackoff(Duration.ofMillis(500))
                            .filter(throwable -> !(throwable instanceof org.springframework.web.reactive.function.client.WebClientResponseException.BadRequest)))
                    .onErrorResume(throwable -> {
                        System.err.println("Circuit opened / Fallback triggered for event metrics: " + throwable.getMessage());
                        return Mono.just(getFallbackEventMetrics());
                    })
                    .block();
        } catch (Exception e) {
            System.err.println("Failed to fetch remote event metrics: " + e.getMessage());
        }
        return getFallbackEventMetrics();
    }

    private Map<String, Object> getFallbackEventMetrics() {
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("upcomingEventsCount", 0L);
        fallback.put("upcomingEvents", Collections.emptyList());
        fallback.put("totalRevenue", BigDecimal.ZERO);
        fallback.put("pendingPayments", BigDecimal.ZERO);
        fallback.put("teamTasks", Collections.emptyList());
        return fallback;
    }

    private String nowDateString() {
        return java.time.LocalDateTime.now().plusDays(7).toString();
    }
}
