package com.eventos.gallery.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaDeletedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID tenantId;
    private List<DeletedItemInfo> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeletedItemInfo implements Serializable {
        private static final long serialVersionUID = 1L;
        private String publicId;
        private boolean isVideo;
    }
}
