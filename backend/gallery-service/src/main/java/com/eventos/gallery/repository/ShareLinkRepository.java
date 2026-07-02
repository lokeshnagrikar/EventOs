package com.eventos.gallery.repository;

import com.eventos.gallery.entity.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, UUID> {
    Optional<ShareLink> findByToken(String token);
    List<ShareLink> findAllByTenantIdAndAlbumId(UUID tenantId, UUID albumId);
    Optional<ShareLink> findByIdAndTenantId(UUID id, UUID tenantId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM ShareLink s WHERE s.expiresAt IS NOT NULL AND s.expiresAt < :now")
    void deleteExpiredShareLinks(java.time.Instant now);
}
