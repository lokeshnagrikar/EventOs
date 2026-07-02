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
public class GoogleLoginRequestDto {
    private String idToken;
    private String accessToken;
    private UUID selectTenantId;
}
