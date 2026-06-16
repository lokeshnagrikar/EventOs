package com.eventos.event.repository;

import com.eventos.event.entity.EventAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventAssignmentRepository extends JpaRepository<EventAssignment, UUID> {
    List<EventAssignment> findAllByEventIdOrderByAssignedAtAsc(UUID eventId);
    void deleteByEventIdAndId(UUID eventId, UUID id);

    // Used for STAFF scoping: find all events a given user is assigned to
    List<EventAssignment> findAllByUserId(UUID userId);

    // Used to verify a user is assigned to an event (STAFF access check)
    boolean existsByEventIdAndUserId(UUID eventId, UUID userId);
}
