package com.eventos.event.repository;

import com.eventos.event.entity.EventTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventTaskRepository extends JpaRepository<EventTask, UUID> {
    List<EventTask> findAllByEventIdOrderByDueDateAsc(UUID eventId);
}
