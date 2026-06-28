package com.eventos.gallery.consumer;

import com.eventos.gallery.event.MediaDeletedEvent;
import com.eventos.gallery.service.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MediaCleanupConsumerTest {

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private MediaCleanupConsumer mediaCleanupConsumer;

    private MediaDeletedEvent mockEvent;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        
        MediaDeletedEvent.DeletedItemInfo item1 = MediaDeletedEvent.DeletedItemInfo.builder()
                .publicId("eventos/tenant/album/photo1")
                .isVideo(false)
                .build();
        
        MediaDeletedEvent.DeletedItemInfo item2 = MediaDeletedEvent.DeletedItemInfo.builder()
                .publicId("eventos/tenant/album/video1")
                .isVideo(true)
                .build();

        mockEvent = MediaDeletedEvent.builder()
                .tenantId(tenantId)
                .items(List.of(item1, item2))
                .build();
    }

    @Test
    void testConsume_Success() throws IOException {
        mediaCleanupConsumer.consume(mockEvent);

        verify(cloudinaryService, times(1)).delete("eventos/tenant/album/photo1", false);
        verify(cloudinaryService, times(1)).delete("eventos/tenant/album/video1", true);
    }

    @Test
    void testConsume_RetryAndSucceed() throws IOException {
        // First delete call throws exception once, then succeeds.
        // Second delete call succeeds immediately.
        doThrow(new IOException("Transient error")).doNothing()
                .when(cloudinaryService).delete("eventos/tenant/album/photo1", false);

        mediaCleanupConsumer.consume(mockEvent);

        verify(cloudinaryService, times(2)).delete("eventos/tenant/album/photo1", false);
        verify(cloudinaryService, times(1)).delete("eventos/tenant/album/video1", true);
    }

    @Test
    void testConsume_MaxRetriesExhausted_ThrowsException() throws IOException {
        // Deletion always fails
        doThrow(new IOException("Cloudinary is down"))
                .when(cloudinaryService).delete(anyString(), anyBoolean());

        assertThrows(RuntimeException.class, () -> {
            mediaCleanupConsumer.consume(mockEvent);
        });

        // Verify that the consumer retried exactly 3 times for the first item before failing
        verify(cloudinaryService, times(3)).delete("eventos/tenant/album/photo1", false);
        // Second item should not be processed because the exception blocks the whole execution
        verify(cloudinaryService, never()).delete("eventos/tenant/album/video1", true);
    }
}
