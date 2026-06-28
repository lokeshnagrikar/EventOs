package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteRequestDto {
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String phone;
}
