package com.eventos.event.repository;

import com.eventos.event.entity.EventTimelineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventTimelineItemRepository extends JpaRepository<EventTimelineItem, UUID> {
    List<EventTimelineItem> findAllByEventIdOrderByScheduledTimeAsc(UUID eventId);

    @Query("SELECT eti FROM EventTimelineItem eti JOIN Event e ON eti.eventId = e.id WHERE e.tenantId = :tenantId AND eti.completed = :completed ORDER BY eti.scheduledTime ASC")
    List<EventTimelineItem> findAllByTenantIdAndCompletedOrderByScheduledTimeAsc(@Param("tenantId") UUID tenantId, @Param("completed") boolean completed);

    long countByEventId(UUID eventId);
    long countByEventIdAndCompletedTrue(UUID eventId);
}
