package com.eventos.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardMetricsDto implements Serializable {
    private static final long serialVersionUID = 1L;

    public DashboardMetricsDto() {
    }

    public DashboardMetricsDto(List<String> visibleWidgets, LeadMetrics leadMetrics, RevenueMetrics revenueMetrics,
                               List<EventDto> upcomingEvents, List<PaymentDto> pendingPayments,
                               List<ActivityDto> recentActivity, List<TaskDto> teamTasks) {
        this.visibleWidgets = visibleWidgets;
        this.leadMetrics = leadMetrics;
        this.revenueMetrics = revenueMetrics;
        this.upcomingEvents = upcomingEvents;
        this.pendingPayments = pendingPayments;
        this.recentActivity = recentActivity;
        this.teamTasks = teamTasks;
    }

    private List<String> visibleWidgets;
    private LeadMetrics leadMetrics;
    private RevenueMetrics revenueMetrics;
    private List<EventDto> upcomingEvents;
    private List<PaymentDto> pendingPayments;
    private List<ActivityDto> recentActivity;
    private List<TaskDto> teamTasks;

    @Data
    @Builder
    public static class LeadMetrics implements Serializable {
        private static final long serialVersionUID = 1L;

        public LeadMetrics() {
        }

        public LeadMetrics(long totalLeads, double conversionRate, BigDecimal pipelineValue, BigDecimal revenueForecast) {
            this.totalLeads = totalLeads;
            this.conversionRate = conversionRate;
            this.pipelineValue = pipelineValue;
            this.revenueForecast = revenueForecast;
        }

        private long totalLeads;
        private double conversionRate;
        private BigDecimal pipelineValue;
        private BigDecimal revenueForecast;
    }

    @Data
    @Builder
    public static class RevenueMetrics implements Serializable {
        private static final long serialVersionUID = 1L;

        public RevenueMetrics() {
        }

        public RevenueMetrics(String totalRevenue, String outstandingBalance, String percentIncrease) {
            this.totalRevenue = totalRevenue;
            this.outstandingBalance = outstandingBalance;
            this.percentIncrease = percentIncrease;
        }

        private String totalRevenue;
        private String outstandingBalance;
        private String percentIncrease;
    }

    @Data
    @Builder
    public static class EventDto implements Serializable {
        private static final long serialVersionUID = 1L;

        public EventDto() {
        }

        public EventDto(String id, String name, String type, String status, String startDate, String location) {
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
    public static class PaymentDto implements Serializable {
        private static final long serialVersionUID = 1L;

        public PaymentDto() {
        }

        public PaymentDto(String bookingNumber, String dueDate, double amount, String status) {
            this.bookingNumber = bookingNumber;
            this.dueDate = dueDate;
            this.amount = amount;
            this.status = status;
        }

        private String bookingNumber;
        private String dueDate;
        private double amount;
        private String status;
    }

    @Data
    @Builder
    public static class ActivityDto implements Serializable {
        private static final long serialVersionUID = 1L;

        public ActivityDto() {
        }

        public ActivityDto(String id, String time, String message) {
            this.id = id;
            this.time = time;
            this.message = message;
        }

        private String id;
        private String time;
        private String message;
    }

    @Data
    @Builder
    public static class TaskDto implements Serializable {
        private static final long serialVersionUID = 1L;

        public TaskDto() {
        }

        public TaskDto(String id, String title, String description, String scheduledTime, boolean completed) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.scheduledTime = scheduledTime;
            this.completed = completed;
        }

        private String id;
        private String title;
        private String description;
        private String scheduledTime;
        private boolean completed;
    }
}
