package com.eventos.gallery.service;

import com.eventos.gallery.config.MessagingConfig;
import com.eventos.gallery.event.AlbumDeletedEvent;
import com.eventos.gallery.event.MediaDeletedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class GalleryCleanupListener {

    private static final Logger log = LoggerFactory.getLogger(GalleryCleanupListener.class);
    private final RabbitTemplate rabbitTemplate;

    public GalleryCleanupListener(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAlbumDeleted(AlbumDeletedEvent event) {
        log.info("Publishing asynchronous media cleanup to RabbitMQ for deleted album: {} under tenant: {}", event.getAlbumId(), event.getTenantId());
        
        if (event.getItems() == null || event.getItems().isEmpty()) {
            return;
        }

        List<MediaDeletedEvent.DeletedItemInfo> itemsToClean = event.getItems().stream()
                .filter(item -> item.getPublicId() != null && !item.getPublicId().isEmpty())
                .map(item -> MediaDeletedEvent.DeletedItemInfo.builder()
                        .publicId(item.getPublicId())
                        .isVideo(item.isVideo())
                        .build())
                .collect(Collectors.toList());

        if (itemsToClean.isEmpty()) {
            return;
        }

        try {
            MediaDeletedEvent rabbitEvent = MediaDeletedEvent.builder()
                    .tenantId(event.getTenantId())
                    .items(itemsToClean)
                    .build();
            rabbitTemplate.convertAndSend(MessagingConfig.EXCHANGE, MessagingConfig.CLEANUP_ROUTING_KEY, rabbitEvent);
            log.info("Successfully published cleanup event for album {} containing {} items", event.getAlbumId(), itemsToClean.size());
        } catch (Exception e) {
            log.error("Failed to publish album cleanup event to RabbitMQ for album ID: {}", event.getAlbumId(), e);
        }
    }
}
