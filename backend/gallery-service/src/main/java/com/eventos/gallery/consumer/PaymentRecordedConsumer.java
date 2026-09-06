package com.eventos.gallery.consumer;

import com.eventos.gallery.config.MessagingConfig;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.ShareLink;
import com.eventos.gallery.event.PaymentRecordedEvent;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.ShareLinkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class PaymentRecordedConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentRecordedConsumer.class);

    private final AlbumRepository albumRepository;
    private final ShareLinkRepository shareLinkRepository;

    public PaymentRecordedConsumer(AlbumRepository albumRepository, ShareLinkRepository shareLinkRepository) {
        this.albumRepository = albumRepository;
        this.shareLinkRepository = shareLinkRepository;
    }

    @RabbitListener(queues = MessagingConfig.PAYMENT_RECORDED_QUEUE)
    @Transactional
    public void consume(PaymentRecordedEvent event) {
        log.info("Received PaymentRecordedEvent for tenant: {}, bookingId: {}, amount: {}", 
                event.getTenantId(), event.getBookingId(), event.getAmount());

        if (event.getTenantId() == null || event.getBookingId() == null) {
            log.warn("PaymentRecordedEvent missing tenantId or bookingId, skipping");
            return;
        }

        try {
            // Find all albums associated with this booking/event
            List<Album> albums = albumRepository.findAllByTenantIdAndEventId(event.getTenantId(), event.getBookingId());
            if (albums == null || albums.isEmpty()) {
                log.info("No albums found for tenant: {} and eventId: {}", event.getTenantId(), event.getBookingId());
                return;
            }

            int updatedLinksCount = 0;
            for (Album album : albums) {
                List<ShareLink> shareLinks = shareLinkRepository.findAllByTenantIdAndAlbumId(event.getTenantId(), album.getId());
                for (ShareLink shareLink : shareLinks) {
                    boolean modified = false;
                    // If watermark was on, clear it now that payment is recorded
                    if (shareLink.isWatermark()) {
                        shareLink.setWatermark(false);
                        modified = true;
                    }
                    // If downloads were disabled, enable them
                    if (!shareLink.isAllowDownload()) {
                        shareLink.setAllowDownload(true);
                        modified = true;
                    }

                    if (modified) {
                        shareLinkRepository.save(shareLink);
                        updatedLinksCount++;
                        log.info("Updated ShareLink ID {} for Album {}: watermark cleared and downloads enabled", 
                                shareLink.getId(), album.getName());
                    }
                }
            }

            log.info("Successfully processed PaymentRecordedEvent for booking {}: updated {} share links across {} albums",
                    event.getBookingId(), updatedLinksCount, albums.size());
        } catch (Exception e) {
            log.error("Error processing PaymentRecordedEvent for tenant {} and booking {}: {}", 
                    event.getTenantId(), event.getBookingId(), e.getMessage(), e);
            throw e;
        }
    }
}
