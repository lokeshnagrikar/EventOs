package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class AdminBootstrapDto {

    public AdminBootstrapDto() {
    }

    public AdminBootstrapDto(String email, String newPassword, String bootstrapSecret) {
        this.email = email;
        this.newPassword = newPassword;
        this.bootstrapSecret = bootstrapSecret;
    }
    private String email;
    private String newPassword;
    private String bootstrapSecret;
}
