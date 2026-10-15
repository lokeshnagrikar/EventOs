package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
public class GoogleLoginRequestDto {

    public GoogleLoginRequestDto() {
    }

    public GoogleLoginRequestDto(String idToken, String accessToken, UUID selectTenantId) {
        this.idToken = idToken;
        this.accessToken = accessToken;
        this.selectTenantId = selectTenantId;
    }
    private String idToken;
    private String accessToken;
    private UUID selectTenantId;
}
