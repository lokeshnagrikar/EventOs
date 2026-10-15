package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class RegisterRequestDto {

    public RegisterRequestDto() {
    }

    public RegisterRequestDto(String firstName, String lastName, String email, String phone, String companyName, String password) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.companyName = companyName;
        this.password = password;
    }
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String companyName;
    private String password;
}
