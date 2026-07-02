package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column(name = "logo_url")
    private String logoUrl;

    private String email;
    private String phone;
    private String website;
    private String address;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "slug")
    private String slug;

    @Column(name = "cover_url")
    private String coverUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "accent_color")
    private String accentColor;

    @Column(name = "gradient_presets")
    private String gradientPresets;

    @Column(name = "font_selection")
    private String fontSelection;

    @Column(name = "dark_theme_logo")
    private String darkThemeLogo;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "pan_number")
    private String panNumber;

    @Column(name = "business_hours")
    private String businessHours;

    @Column(name = "date_format")
    private String dateFormat;

    @Column(name = "language")
    private String language;

    @Column(name = "email_branding", columnDefinition = "TEXT")
    private String emailBranding;

    @Column(name = "invoice_branding", columnDefinition = "TEXT")
    private String invoiceBranding;

    @Column(name = "pdf_branding", columnDefinition = "TEXT")
    private String pdfBranding;

    @Column(nullable = false)
    private String timezone;

    @Column(nullable = false)
    private String currency;

    @Column(name = "primary_color")
    private String primaryColor;

    @Column(name = "secondary_color")
    private String secondaryColor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        timezone = "Asia/Kolkata";
        currency = "INR";
        primaryColor = "#9333ea";
        secondaryColor = "#18181b";
        accentColor = "#db2777";
        gradientPresets = "purple-pink";
        fontSelection = "Inter";
        language = "en";
        dateFormat = "DD/MM/YYYY";
        businessHours = "9:00 AM - 6:00 PM";
        isDeleted = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
