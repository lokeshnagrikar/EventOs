package com.eventos.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRoleDto {

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;

    private List<String> permissions;

    private String permissionsJson;
}
