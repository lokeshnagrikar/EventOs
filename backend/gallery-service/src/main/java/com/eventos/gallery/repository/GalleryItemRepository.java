package com.eventos.gallery.repository;

import com.eventos.gallery.entity.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GalleryItemRepository extends JpaRepository<GalleryItem, UUID> {
    List<GalleryItem> findAllByTenantIdAndAlbumId(UUID tenantId, UUID albumId);
    Optional<GalleryItem> findByIdAndTenantId(UUID id, UUID tenantId);
    List<GalleryItem> findAllByTenantId(UUID tenantId);

    @Query("SELECT DISTINCT gi FROM GalleryItem gi LEFT JOIN gi.tags t WHERE gi.tenantId = :tenantId AND gi.album.id = :albumId " +
           "AND (:category IS NULL OR gi.category = :category) " +
           "AND (:favorite IS NULL OR gi.favorite = :favorite) " +
           "AND (:tag IS NULL OR t = :tag)")
    List<GalleryItem> findFiltered(@Param("tenantId") UUID tenantId, 
                                   @Param("albumId") UUID albumId, 
                                   @Param("category") String category, 
                                   @Param("tag") String tag, 
                                   @Param("favorite") Boolean favorite);
}
