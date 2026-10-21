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
public class LoginRequestDto {

    public LoginRequestDto(String email, String password, UUID tenantId, String captchaId, String captchaValue) {
        this.email = email;
        this.password = password;
        this.tenantId = tenantId;
        this.captchaId = captchaId;
        this.captchaValue = captchaValue;
        this.rememberMe = false;
    }

    private String email;
    private String password;
    private UUID tenantId;
    private String captchaId;
    private String captchaValue;
    private Boolean rememberMe;
}
