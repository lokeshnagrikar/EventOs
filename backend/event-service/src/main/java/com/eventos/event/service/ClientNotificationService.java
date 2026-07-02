package com.eventos.event.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ClientNotificationService {

    public List<Map<String, Object>> getNotifications(String clientEmail, UUID tenantId) {
        List<Map<String, Object>> notifications = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        // 1. Today's notifications
        Map<String, Object> n1 = new HashMap<>();
        n1.put("id", UUID.randomUUID());
        n1.put("title", "Quotation Updated");
        n1.put("message", "Your designer Sneha Rao has updated the floral quotation details.");
        n1.put("createdAt", now.minusHours(2));
        n1.put("read", false);
        n1.put("category", "TODAY");
        notifications.add(n1);

        // 2. Yesterday's notifications
        Map<String, Object> n2 = new HashMap<>();
        n2.put("id", UUID.randomUUID());
        n2.put("title", "Payment Confirmed");
        n2.put("message", "We verified and cleared deposit payment ref: UPI 310892.");
        n2.put("createdAt", now.minusDays(1).minusHours(4));
        n2.put("read", true);
        n2.put("category", "YESTERDAY");
        notifications.add(n2);

        // 3. Earlier notifications
        Map<String, Object> n3 = new HashMap<>();
        n3.put("id", UUID.randomUUID());
        n3.put("title", "Venue Details Confirmed");
        n3.put("message", "Event space bookings confirmed with hotel banquet office.");
        n3.put("createdAt", now.minusDays(5));
        n3.put("read", true);
        n3.put("category", "EARLIER");
        notifications.add(n3);

        return notifications;
    }
}
