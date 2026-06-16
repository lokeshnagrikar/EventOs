package com.eventos.event.repository;

import com.eventos.event.entity.BookingAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingAssignmentRepository extends JpaRepository<BookingAssignment, UUID> {
    List<BookingAssignment> findAllByBookingIdOrderByAssignedAtDesc(UUID bookingId);
}
