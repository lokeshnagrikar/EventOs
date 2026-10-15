package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class VerifyOtpRequestDto {

    public VerifyOtpRequestDto() {
    }

    public VerifyOtpRequestDto(String email, String otp) {
        this.email = email;
        this.otp = otp;
    }
    private String email;
    private String otp;
}
