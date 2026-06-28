package com.eventos.gallery.repository;

import com.eventos.gallery.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query(value = 
        "SELECT a.id as id, a.tenant_id as tenantId, a.name as name, a.description as description, a.event_id as eventId, a.created_at as createdAt, a.updated_at as updatedAt, " +
        "a.status as status, a.visibility as visibility, a.cover_image as coverImage, " +
        "(SELECT COUNT(g.id) FROM gallery_items g WHERE g.album_id = a.id) as itemCount, " +
        "(SELECT g.url FROM gallery_items g WHERE g.album_id = a.id ORDER BY g.created_at DESC LIMIT 1) as thumbnailUrl " +
        "FROM albums a " +
        "WHERE a.tenant_id = :tenantId", 
        nativeQuery = true)
    List<AlbumResponseProjection> findAllWithStatsByTenantId(@Param("tenantId") UUID tenantId);

    @Query(value = 
        "SELECT a.id as id, a.tenant_id as tenantId, a.name as name, a.description as description, a.event_id as eventId, a.created_at as createdAt, a.updated_at as updatedAt, " +
        "a.status as status, a.visibility as visibility, a.cover_image as coverImage, " +
        "(SELECT COUNT(g.id) FROM gallery_items g WHERE g.album_id = a.id) as itemCount, " +
        "(SELECT g.url FROM gallery_items g WHERE g.album_id = a.id ORDER BY g.created_at DESC LIMIT 1) as thumbnailUrl " +
        "FROM albums a " +
        "WHERE a.tenant_id = :tenantId AND a.event_id = :eventId", 
        nativeQuery = true)
    List<AlbumResponseProjection> findAllWithStatsByTenantIdAndEventId(@Param("tenantId") UUID tenantId, @Param("eventId") UUID eventId);

    @Query(value = 
        "SELECT a.id as id, a.tenant_id as tenantId, a.name as name, a.description as description, a.event_id as eventId, a.created_at as createdAt, a.updated_at as updatedAt, " +
        "a.status as status, a.visibility as visibility, a.cover_image as coverImage, " +
        "(SELECT COUNT(g.id) FROM gallery_items g WHERE g.album_id = a.id) as itemCount, " +
        "(SELECT g.url FROM gallery_items g WHERE g.album_id = a.id ORDER BY g.created_at DESC LIMIT 1) as thumbnailUrl " +
        "FROM albums a " +
        "WHERE a.tenant_id = :tenantId AND a.event_id IN (:eventIds)", 
        nativeQuery = true)
    List<AlbumResponseProjection> findAllWithStatsByTenantIdAndEventIdIn(@Param("tenantId") UUID tenantId, @Param("eventIds") List<UUID> eventIds);

    @Query(value = 
        "SELECT a.id as id, a.tenant_id as tenantId, a.name as name, a.description as description, a.event_id as eventId, a.created_at as createdAt, a.updated_at as updatedAt, " +
        "a.status as status, a.visibility as visibility, a.cover_image as coverImage, " +
        "(SELECT COUNT(g.id) FROM gallery_items g WHERE g.album_id = a.id) as itemCount, " +
        "(SELECT g.url FROM gallery_items g WHERE g.album_id = a.id ORDER BY g.created_at DESC LIMIT 1) as thumbnailUrl " +
        "FROM albums a " +
        "WHERE a.tenant_id = :tenantId AND a.status = :status AND a.event_id = :eventId", 
        nativeQuery = true)
    List<AlbumResponseProjection> findAllWithStatsByTenantIdAndStatusAndEventId(@Param("tenantId") UUID tenantId, @Param("status") String status, @Param("eventId") UUID eventId);

    @Query(value = 
        "SELECT a.id as id, a.tenant_id as tenantId, a.name as name, a.description as description, a.event_id as eventId, a.created_at as createdAt, a.updated_at as updatedAt, " +
        "a.status as status, a.visibility as visibility, a.cover_image as coverImage, " +
        "(SELECT COUNT(g.id) FROM gallery_items g WHERE g.album_id = a.id) as itemCount, " +
        "(SELECT g.url FROM gallery_items g WHERE g.album_id = a.id ORDER BY g.created_at DESC LIMIT 1) as thumbnailUrl " +
        "FROM albums a " +
        "WHERE a.tenant_id = :tenantId AND a.status = :status AND a.event_id IN (:eventIds)", 
        nativeQuery = true)
    List<AlbumResponseProjection> findAllWithStatsByTenantIdAndStatusAndEventIdIn(@Param("tenantId") UUID tenantId, @Param("status") String status, @Param("eventIds") List<UUID> eventIds);
}

