package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
public class SessionResponseDto {

    public SessionResponseDto() {
    }

    public SessionResponseDto(UUID id, String deviceModel, String osName, String browser, String ipAddress, String lastActiveAt, boolean isCurrent) {
        this.id = id;
        this.deviceModel = deviceModel;
        this.osName = osName;
        this.browser = browser;
        this.ipAddress = ipAddress;
        this.lastActiveAt = lastActiveAt;
        this.isCurrent = isCurrent;
    }
    private UUID id;
    private String deviceModel;
    private String osName;
    private String browser;
    private String ipAddress;
    private String lastActiveAt;
    private boolean isCurrent;
}
