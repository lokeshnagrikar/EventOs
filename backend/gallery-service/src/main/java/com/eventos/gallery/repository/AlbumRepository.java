package com.eventos.gallery.repository;

import com.eventos.gallery.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlbumRepository extends JpaRepository<Album, UUID> {
    List<Album> findAllByTenantId(UUID tenantId);
    Optional<Album> findByIdAndTenantId(UUID id, UUID tenantId);
    List<Album> findAllByTenantIdAndEventId(UUID tenantId, UUID eventId);
    List<Album> findAllByTenantIdAndEventIdIn(UUID tenantId, List<UUID> eventIds);
}
