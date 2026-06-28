package com.eventos.event.repository;

import com.eventos.event.entity.BookingAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingAssignmentRepository extends JpaRepository<BookingAssignment, UUID> {
    List<BookingAssignment> findAllByBookingIdOrderByAssignedAtDesc(UUID bookingId);

    @Query("SELECT ba FROM BookingAssignment ba WHERE ba.resourceType = 'STAFF' AND (LOWER(ba.resourceName) = LOWER(:email) OR ba.resourceName = :userId)")
    List<BookingAssignment> findStaffAssignments(@Param("email") String email, @Param("userId") String userId);
}
