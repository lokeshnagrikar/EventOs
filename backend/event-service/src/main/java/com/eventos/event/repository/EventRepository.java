package com.eventos.event.repository;

import com.eventos.event.entity.Event;
import com.eventos.event.entity.EventStatus;
import com.eventos.event.entity.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    List<Event> findAllByTenantIdOrderByStartDateAsc(UUID tenantId);
    Page<Event> findAllByTenantIdOrderByStartDateAsc(UUID tenantId, Pageable pageable);
    Optional<Event> findByIdAndTenantId(UUID id, UUID tenantId);

    List<Event> findAllByTenantIdAndStatusOrderByStartDateAsc(UUID tenantId, EventStatus status);
    Page<Event> findAllByTenantIdAndStatusOrderByStartDateAsc(UUID tenantId, EventStatus status, Pageable pageable);

    List<Event> findAllByTenantIdAndTypeOrderByStartDateAsc(UUID tenantId, EventType type);
    Page<Event> findAllByTenantIdAndTypeOrderByStartDateAsc(UUID tenantId, EventType type, Pageable pageable);

    List<Event> findAllByTenantIdAndStatusAndTypeOrderByStartDateAsc(UUID tenantId, EventStatus status, EventType type);
    Page<Event> findAllByTenantIdAndStatusAndTypeOrderByStartDateAsc(UUID tenantId, EventStatus status, EventType type, Pageable pageable);

    List<Event> findAllByIdInAndTenantId(List<UUID> ids, UUID tenantId);

    long countByTenantIdAndStartDateAfter(UUID tenantId, LocalDateTime startDate);
    List<Event> findTop5ByTenantIdAndStartDateAfterOrderByStartDateAsc(UUID tenantId, LocalDateTime startDate);

    @Query("SELECT e.status, COUNT(e) FROM Event e WHERE e.tenantId = :tenantId GROUP BY e.status")
    List<Object[]> countByStatusAndTenantId(@Param("tenantId") UUID tenantId);

    @Query("SELECT e.type, COUNT(e) FROM Event e WHERE e.tenantId = :tenantId GROUP BY e.type")
    List<Object[]> countByTypeAndTenantId(@Param("tenantId") UUID tenantId);

    // ── Date-range search (used by GET /events) ────────────────────────────────

    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:type IS NULL OR e.type = :type) " +
           "AND (:startDate IS NULL OR e.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR e.endDate <= :endDate)")
    Page<Event> searchEvents(
            @Param("tenantId") UUID tenantId,
            @Param("status")    EventStatus status,
            @Param("type")      EventType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate")   LocalDateTime endDate,
            Pageable pageable);

    // ── STAFF-scoped search (only events the user is assigned to) ─────────────

    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId " +
           "AND e.id IN :eventIds " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:type IS NULL OR e.type = :type) " +
           "AND (:startDate IS NULL OR e.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR e.endDate <= :endDate)")
    Page<Event> searchEventsForStaff(
            @Param("tenantId")  UUID tenantId,
            @Param("status")    EventStatus status,
            @Param("type")      EventType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate")   LocalDateTime endDate,
            @Param("eventIds")  List<UUID> eventIds,
            Pageable pageable);
}
