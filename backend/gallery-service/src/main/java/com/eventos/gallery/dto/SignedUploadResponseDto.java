package com.eventos.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignedUploadResponseDto {
    private String signature;
    private long timestamp;
    private String apiKey;
    private String cloudName;
    private String publicId;
    private String folder;
    private String uploadUrl;
}
