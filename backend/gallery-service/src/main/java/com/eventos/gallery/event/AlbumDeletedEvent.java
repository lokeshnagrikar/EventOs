package com.eventos.gallery.event;

import org.springframework.context.ApplicationEvent;
import java.util.List;
import java.util.UUID;

public class AlbumDeletedEvent extends ApplicationEvent {
    private final UUID tenantId;
    private final UUID albumId;
    private final List<DeletedItemInfo> items;

    public AlbumDeletedEvent(Object source, UUID tenantId, UUID albumId, List<DeletedItemInfo> items) {
        super(source);
        this.tenantId = tenantId;
        this.albumId = albumId;
        this.items = items;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public UUID getAlbumId() {
        return albumId;
    }

    public List<DeletedItemInfo> getItems() {
        return items;
    }

    public static class DeletedItemInfo {
        private final String publicId;
        private final boolean isVideo;

        public DeletedItemInfo(String publicId, boolean isVideo) {
            this.publicId = publicId;
            this.isVideo = isVideo;
        }

        public String getPublicId() {
            return publicId;
        }

        public boolean isVideo() {
            return isVideo;
        }
    }
}
