package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class ResetPasswordRequestDto {

    public ResetPasswordRequestDto() {
    }

    public ResetPasswordRequestDto(String token, String password) {
        this.token = token;
        this.password = password;
    }
    private String token;
    private String password;
}
