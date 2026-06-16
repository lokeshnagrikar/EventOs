package com.eventos.gallery.service;

import com.eventos.gallery.dto.CreateShareLinkDto;
import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.dto.ShareLinkResponseDto;
import com.eventos.gallery.dto.SharedAlbumResponseDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.entity.ShareLink;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import com.eventos.gallery.repository.ShareLinkRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShareLinkService {

    private final ShareLinkRepository shareLinkRepository;
    private final AlbumRepository albumRepository;
    private final GalleryItemRepository galleryItemRepository;
    private final GalleryItemService galleryItemService;
    private final BCryptPasswordEncoder passwordEncoder;

    public ShareLinkService(ShareLinkRepository shareLinkRepository,
                            AlbumRepository albumRepository,
                            GalleryItemRepository galleryItemRepository,
                            GalleryItemService galleryItemService) {
        this.shareLinkRepository = shareLinkRepository;
        this.albumRepository = albumRepository;
        this.galleryItemRepository = galleryItemRepository;
        this.galleryItemService = galleryItemService;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Transactional
    public ShareLinkResponseDto createShareLink(CreateShareLinkDto dto, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(dto.getAlbumId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + dto.getAlbumId()));

        String token = UUID.randomUUID().toString().replace("-", "");
        
        LocalDateTime expiresAt = null;
        if (dto.getExpiresInHours() != null && dto.getExpiresInHours() > 0) {
            expiresAt = LocalDateTime.now().plusHours(dto.getExpiresInHours());
        }

        String hashedPassword = null;
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            hashedPassword = passwordEncoder.encode(dto.getPassword().trim());
        }

        ShareLink shareLink = ShareLink.builder()
                .tenantId(tenantId)
                .album(album)
                .token(token)
                .expiresAt(expiresAt)
                .password(hashedPassword)
                .build();

        ShareLink saved = shareLinkRepository.save(shareLink);
        return mapToResponseDto(saved);
    }

    public List<ShareLinkResponseDto> getShareLinksForAlbum(UUID albumId, UUID tenantId) {
        albumRepository.findByIdAndTenantId(albumId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + albumId));

        return shareLinkRepository.findAllByTenantIdAndAlbumId(tenantId, albumId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeShareLink(UUID id, UUID tenantId) {
        ShareLink shareLink = shareLinkRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found with ID: " + id));
        shareLinkRepository.delete(shareLink);
    }

    public SharedAlbumResponseDto getSharedAlbum(String token, String passcode) {
        ShareLink shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found or invalid"));

        if (shareLink.isExpired()) {
            throw new IllegalArgumentException("This share link has expired");
        }

        // Check password protection
        if (shareLink.getPassword() != null && !shareLink.getPassword().isEmpty()) {
            if (passcode == null || passcode.trim().isEmpty()) {
                throw new BadCredentialsException("Passcode required");
            }
            if (!passwordEncoder.matches(passcode.trim(), shareLink.getPassword())) {
                throw new BadCredentialsException("Invalid passcode");
            }
        }

        Album album = shareLink.getAlbum();
        List<GalleryItem> items = galleryItemRepository.findAllByTenantIdAndAlbumId(shareLink.getTenantId(), album.getId());
        
        List<GalleryItemResponseDto> itemDtos = items.stream()
                .map(galleryItemService::mapToResponseDto)
                .collect(Collectors.toList());

        return SharedAlbumResponseDto.builder()
                .albumId(album.getId())
                .name(album.getName())
                .description(album.getDescription())
                .eventId(album.getEventId())
                .items(itemDtos)
                .build();
    }

    public ShareLinkResponseDto mapToResponseDto(ShareLink shareLink) {
        return ShareLinkResponseDto.builder()
                .id(shareLink.getId())
                .albumId(shareLink.getAlbum().getId())
                .token(shareLink.getToken())
                .expiresAt(shareLink.getExpiresAt())
                .passwordProtected(shareLink.getPassword() != null && !shareLink.getPassword().isEmpty())
                .createdAt(shareLink.getCreatedAt())
                .expired(shareLink.isExpired())
                .build();
    }
}
