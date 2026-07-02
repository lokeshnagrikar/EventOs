package com.eventos.gallery.scheduler;

import com.eventos.gallery.repository.ShareLinkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class CleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(CleanupScheduler.class);
    private final ShareLinkRepository shareLinkRepository;

    public CleanupScheduler(ShareLinkRepository shareLinkRepository) {
        this.shareLinkRepository = shareLinkRepository;
    }

    // Run once every hour to clean up expired share links
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredShareLinks() {
        log.info("Running scheduled cleanup for expired share links...");
        try {
            shareLinkRepository.deleteExpiredShareLinks(Instant.now());
            log.info("Successfully cleaned up expired share links.");
        } catch (Exception e) {
            log.error("Failed to run scheduled cleanup for expired share links: {}", e.getMessage());
        }
    }
}
