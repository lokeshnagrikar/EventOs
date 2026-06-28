package com.eventos.gallery.consumer;

import com.eventos.gallery.config.MessagingConfig;
import com.eventos.gallery.event.MediaDeletedEvent;
import com.eventos.gallery.service.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class MediaCleanupConsumer {

    private static final Logger log = LoggerFactory.getLogger(MediaCleanupConsumer.class);
    private final CloudinaryService cloudinaryService;

    public MediaCleanupConsumer(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @RabbitListener(queues = MessagingConfig.CLEANUP_QUEUE)
    public void consume(MediaDeletedEvent event) {
        log.info("Received MediaDeletedEvent for tenant: {} containing {} items", event.getTenantId(), event.getItems() != null ? event.getItems().size() : 0);
        if (event.getItems() == null || event.getItems().isEmpty()) {
            return;
        }

        for (MediaDeletedEvent.DeletedItemInfo item : event.getItems()) {
            if (item.getPublicId() == null || item.getPublicId().trim().isEmpty()) {
                continue;
            }

            int maxRetries = 3;
            int attempt = 0;
            boolean success = false;
            long backoff = 1000;

            while (!success && attempt < maxRetries) {
                try {
                    attempt++;
                    log.info("Deleting public ID {} from Cloudinary (attempt {}/{})", item.getPublicId(), attempt, maxRetries);
                    cloudinaryService.delete(item.getPublicId(), item.isVideo());
                    success = true;
                } catch (Exception e) {
                    log.warn("Failed to delete media item {} from Cloudinary on attempt {}/{}: {}", 
                            item.getPublicId(), attempt, maxRetries, e.getMessage());
                    if (attempt < maxRetries) {
                        try {
                            Thread.sleep(backoff);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                        backoff *= 2;
                    }
                }
            }

            if (!success) {
                log.error("Exhausted retries. Failed to clean up media item {} from Cloudinary", item.getPublicId());
                throw new RuntimeException("Cloudinary deletion failed for " + item.getPublicId());
            }
        }
    }
}
