package com.eventos.auth.scheduler;

import com.eventos.auth.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class TokenCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupScheduler.class);
    private final RefreshTokenRepository refreshTokenRepository;

    public TokenCleanupScheduler(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    // Run every day at 3:00 AM to clean up expired refresh tokens
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupExpiredTokens() {
        log.info("Running scheduled cleanup for expired refresh tokens...");
        try {
            refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
            log.info("Successfully cleaned up expired refresh tokens.");
        } catch (Exception e) {
            log.error("Failed to run scheduled cleanup for expired refresh tokens: {}", e.getMessage());
        }
    }
}
