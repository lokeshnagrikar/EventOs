package com.eventos.gallery.repository;

import com.eventos.gallery.entity.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GalleryItemRepository extends JpaRepository<GalleryItem, UUID> {
    List<GalleryItem> findAllByTenantIdAndAlbumId(UUID tenantId, UUID albumId);
    Optional<GalleryItem> findByIdAndTenantId(UUID id, UUID tenantId);
    List<GalleryItem> findAllByTenantId(UUID tenantId);
}
