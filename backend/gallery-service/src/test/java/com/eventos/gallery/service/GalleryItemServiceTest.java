package com.eventos.gallery.service;

import com.eventos.gallery.dto.ConfirmUploadDto;
import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.dto.SignedUploadResponseDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.entity.GalleryItemType;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import com.eventos.gallery.event.MediaDeletedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GalleryItemServiceTest {

    @Mock
    private GalleryItemRepository galleryItemRepository;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private GalleryItemService galleryItemService;

    private UUID tenantId;
    private UUID albumId;
    private UUID eventId;
    private Album mockAlbum;
    private GalleryItem mockItem;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        albumId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        mockAlbum = Album.builder()
                .id(albumId)
                .tenantId(tenantId)
                .name("Wedding Album")
                .description("John & Jane")
                .eventId(eventId)
                .build();

        mockItem = GalleryItem.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .album(mockAlbum)
                .name("photo.jpg")
                .type(GalleryItemType.IMAGE)
                .url("https://res.cloudinary.com/demo/image/upload/photo.jpg")
                .publicId("eventos_gallery/photo1")
                .size(1024L)
                .format("jpg")
                .build();
    }

    @Test
    void testGenerateUploadSignature() {
        when(albumRepository.findByIdAndTenantId(albumId, tenantId)).thenReturn(Optional.of(mockAlbum));
        
        Map<String, Object> mockSigParams = new HashMap<>();
        mockSigParams.put("signature", "test_signature");
        mockSigParams.put("timestamp", 123456789L);
        mockSigParams.put("apiKey", "test_api_key");
        mockSigParams.put("cloudName", "test_cloud");
        mockSigParams.put("publicId", "eventos_gallery/tenant/album/photo");
        mockSigParams.put("folder", "eventos_gallery/tenant/album");
        mockSigParams.put("uploadUrl", "https://api.cloudinary.com/v1_1/test_cloud/auto/upload");

        when(cloudinaryService.generateUploadSignature(tenantId, albumId, eventId, "photo.jpg")).thenReturn(mockSigParams);

        SignedUploadResponseDto response = galleryItemService.generateUploadSignature(albumId, "photo.jpg", tenantId);

        assertNotNull(response);
        assertEquals("test_signature", response.getSignature());
        assertEquals(123456789L, response.getTimestamp());
        assertEquals("test_api_key", response.getApiKey());
        assertEquals("test_cloud", response.getCloudName());
        assertEquals("eventos_gallery/tenant/album/photo", response.getPublicId());
        assertEquals("https://api.cloudinary.com/v1_1/test_cloud/auto/upload", response.getUploadUrl());
    }

    @Test
    void testConfirmUpload() {
        ConfirmUploadDto dto = new ConfirmUploadDto();
        dto.setAlbumId(albumId);
        dto.setName("photo.jpg");
        dto.setType(GalleryItemType.IMAGE);
        dto.setUrl("https://res.cloudinary.com/demo/image/upload/photo.jpg");
        dto.setPublicId("eventos_gallery/photo1");
        dto.setSize(1024L);
        dto.setFormat("jpg");
        dto.setWidth(1920);
        dto.setHeight(1080);
        dto.setResourceType("image");

        when(albumRepository.findByIdAndTenantId(albumId, tenantId)).thenReturn(Optional.of(mockAlbum));
        when(galleryItemRepository.save(any(GalleryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GalleryItemResponseDto response = galleryItemService.confirmUpload(dto, tenantId);

        assertNotNull(response);
        assertEquals("photo.jpg", response.getName());
        assertEquals(GalleryItemType.IMAGE, response.getType());
        assertEquals("https://res.cloudinary.com/demo/image/upload/photo.jpg", response.getUrl());
        assertEquals("eventos_gallery/photo1", response.getPublicId());
        assertEquals(1920, response.getWidth());
        assertEquals(1080, response.getHeight());
        assertEquals("image", response.getResourceType());
    }

    @Test
    void testDeleteItem_PublishesRabbitMessage() {
        UUID itemId = mockItem.getId();
        when(galleryItemRepository.findByIdAndTenantId(itemId, tenantId)).thenReturn(Optional.of(mockItem));

        galleryItemService.deleteItem(itemId, tenantId);

        verify(galleryItemRepository, times(1)).delete(mockItem);
        verify(rabbitTemplate, times(1)).convertAndSend(
                eq("eventos.exchange"),
                eq("gallery.media.deleted"),
                any(MediaDeletedEvent.class)
        );
    }
}
