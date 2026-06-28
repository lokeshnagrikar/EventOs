package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponseDto {
    private UUID id;
    private String deviceModel;
    private String osName;
    private String browser;
    private String ipAddress;
    private String lastActiveAt;
    private boolean isCurrent;
}
