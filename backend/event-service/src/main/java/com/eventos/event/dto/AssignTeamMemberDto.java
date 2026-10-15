package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
public class AssignTeamMemberDto {

    public AssignTeamMemberDto() {
    }

    public AssignTeamMemberDto(UUID userId, String userName, String role) {
        this.userId = userId;
        this.userName = userName;
        this.role = role;
    }

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotBlank(message = "User name is required")
    private String userName;

    @NotBlank(message = "Role is required")
    private String role;
}
