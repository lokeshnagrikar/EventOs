package com.eventos.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDashboardMetricsDto {

    private long upcomingEventsCount;
    private List<EventSummaryDto> upcomingEvents;
    private BigDecimal totalRevenue;
    private BigDecimal pendingPayments;
    private List<TaskSummaryDto> teamTasks;

    private long outstandingInvoicesCount;
    private BigDecimal outstandingInvoicesAmount;
    private BigDecimal estimatedCosts;
    private BigDecimal actualCosts;
    private BigDecimal profitMargin;
    private BigDecimal profitMarginPercentage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EventSummaryDto {
        private String id;
        private String name;
        private String type;
        private String status;
        private String startDate;
        private String location;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskSummaryDto {
        private String id;
        private String eventId;
        private String eventName;
        private String title;
        private String description;
        private String scheduledTime;
        private boolean completed;
    }
}
