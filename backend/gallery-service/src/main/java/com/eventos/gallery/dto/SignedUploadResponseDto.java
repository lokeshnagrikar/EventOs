package com.eventos.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class SignedUploadResponseDto {

    public SignedUploadResponseDto() {
    }

    public SignedUploadResponseDto(String signature, long timestamp, String apiKey, String cloudName, String publicId, String folder, String uploadUrl) {
        this.signature = signature;
        this.timestamp = timestamp;
        this.apiKey = apiKey;
        this.cloudName = cloudName;
        this.publicId = publicId;
        this.folder = folder;
        this.uploadUrl = uploadUrl;
    }
    private String signature;
    private long timestamp;
    private String apiKey;
    private String cloudName;
    private String publicId;
    private String folder;
    private String uploadUrl;
}
