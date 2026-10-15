package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class InviteRequestDto {

    public InviteRequestDto() {
    }

    public InviteRequestDto(String email, String firstName, String lastName, String role, String phone) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.phone = phone;
    }
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String phone;
}
