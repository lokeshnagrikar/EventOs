package com.eventos.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardMetricsDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<String> visibleWidgets;

    private LeadMetrics leadMetrics;
    private RevenueMetrics revenueMetrics;
    private List<EventDto> upcomingEvents;
    private List<PaymentDto> pendingPayments;
    private List<ActivityDto> recentActivity;
    private List<TaskDto> teamTasks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LeadMetrics implements Serializable {
        private static final long serialVersionUID = 1L;
        private long totalLeads;
        private double conversionRate;
        private BigDecimal pipelineValue;
        private BigDecimal revenueForecast;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueMetrics implements Serializable {
        private static final long serialVersionUID = 1L;
        private String totalRevenue;
        private String outstandingBalance;
        private String percentIncrease;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EventDto implements Serializable {
        private static final long serialVersionUID = 1L;
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
    public static class PaymentDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private String bookingNumber;
        private String dueDate;
        private double amount;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivityDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private String id;
        private String time;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskDto implements Serializable {
        private static final long serialVersionUID = 1L;
        private String id;
        private String title;
        private String description;
        private String scheduledTime;
        private boolean completed;
    }
}
