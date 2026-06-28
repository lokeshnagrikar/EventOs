package com.eventos.gallery.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "gallery_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GalleryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GalleryItemType type;

    @Column(nullable = false, length = 1000)
    private String url;

    @Column(name = "public_id")
    private String publicId;

    private Long size;

    private String format;

    private Double duration;

    private Integer width;

    private Integer height;

    @Column(name = "resource_type")
    private String resourceType;

    private String category;

    @Builder.Default
    @Column(nullable = false)
    private boolean favorite = false;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "gallery_item_tags", joinColumns = @JoinColumn(name = "gallery_item_id"))
    @Column(name = "tag")
    @Builder.Default
    private java.util.Set<String> tags = new java.util.HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
