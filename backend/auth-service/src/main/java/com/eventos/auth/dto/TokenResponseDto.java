package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class TokenResponseDto {

    public TokenResponseDto() {
    }

    public TokenResponseDto(String accessToken, String userId, String tenantId, String role, String firstName, List<Map<String, Object>> memberships) {
        this.accessToken = accessToken;
        this.userId = userId;
        this.tenantId = tenantId;
        this.role = role;
        this.firstName = firstName;
        this.memberships = memberships;
    }
    private String accessToken;
    private String userId;
    private String tenantId;
    private String role;
    private String firstName;
    private List<Map<String, Object>> memberships;
}
