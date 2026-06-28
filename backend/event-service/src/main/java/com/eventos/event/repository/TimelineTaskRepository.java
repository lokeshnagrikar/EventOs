package com.eventos.event.repository;

import com.eventos.event.entity.TimelineTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TimelineTaskRepository extends JpaRepository<TimelineTask, UUID> {
    List<TimelineTask> findAllByEventIdOrderByDueDateAsc(UUID eventId);
    long countByEventId(UUID eventId);
    long countByEventIdAndCompletedTrue(UUID eventId);
    List<TimelineTask> findAllByTenantIdAndDueDateBeforeAndCompletedFalse(UUID tenantId, java.time.LocalDateTime now);
    List<TimelineTask> findAllByTenantIdOrderByDueDateAsc(UUID tenantId);
}
