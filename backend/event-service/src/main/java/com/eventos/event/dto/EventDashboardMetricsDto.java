package com.eventos.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class EventDashboardMetricsDto {

    public EventDashboardMetricsDto() {
    }

    public EventDashboardMetricsDto(long upcomingEventsCount, List<EventSummaryDto> upcomingEvents,
                                    BigDecimal totalRevenue, BigDecimal pendingPayments,
                                    List<TaskSummaryDto> teamTasks, long outstandingInvoicesCount,
                                    BigDecimal outstandingInvoicesAmount, BigDecimal estimatedCosts,
                                    BigDecimal actualCosts, BigDecimal profitMargin, BigDecimal profitMarginPercentage) {
        this.upcomingEventsCount = upcomingEventsCount;
        this.upcomingEvents = upcomingEvents;
        this.totalRevenue = totalRevenue;
        this.pendingPayments = pendingPayments;
        this.teamTasks = teamTasks;
        this.outstandingInvoicesCount = outstandingInvoicesCount;
        this.outstandingInvoicesAmount = outstandingInvoicesAmount;
        this.estimatedCosts = estimatedCosts;
        this.actualCosts = actualCosts;
        this.profitMargin = profitMargin;
        this.profitMarginPercentage = profitMarginPercentage;
    }

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
    @Builder
    public static class EventSummaryDto {

        public EventSummaryDto() {
        }

        public EventSummaryDto(String id, String name, String type, String status, String startDate, String location) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.status = status;
            this.startDate = startDate;
            this.location = location;
        }

        private String id;
        private String name;
        private String type;
        private String status;
        private String startDate;
        private String location;
    }

    @Data
    @Builder
    public static class TaskSummaryDto {

        public TaskSummaryDto() {
        }

        public TaskSummaryDto(String id, String eventId, String eventName, String title, String description, String scheduledTime, boolean completed) {
            this.id = id;
            this.eventId = eventId;
            this.eventName = eventName;
            this.title = title;
            this.description = description;
            this.scheduledTime = scheduledTime;
            this.completed = completed;
        }

        private String id;
        private String eventId;
        private String eventName;
        private String title;
        private String description;
        private String scheduledTime;
        private boolean completed;
    }
}
