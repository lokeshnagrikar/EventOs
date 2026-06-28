package com.eventos.gallery.repository;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AlbumResponseProjection {
    UUID getId();
    UUID getTenantId();
    String getName();
    String getDescription();
    UUID getEventId();
    LocalDateTime getCreatedAt();
    LocalDateTime getUpdatedAt();
    long getItemCount();
    String getThumbnailUrl();
    String getStatus();
    String getVisibility();
    String getCoverImage();
}
