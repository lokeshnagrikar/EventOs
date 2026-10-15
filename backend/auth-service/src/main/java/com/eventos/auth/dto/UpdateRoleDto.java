package com.eventos.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
public class UpdateRoleDto {

    public UpdateRoleDto() {
    }

    public UpdateRoleDto(String description, List<String> permissions, String permissionsJson) {
        this.description = description;
        this.permissions = permissions;
        this.permissionsJson = permissionsJson;
    }

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;

    private List<String> permissions;

    private String permissionsJson;
}
