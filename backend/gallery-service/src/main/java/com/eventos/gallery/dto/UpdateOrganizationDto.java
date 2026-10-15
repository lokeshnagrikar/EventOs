package com.eventos.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
public class UpdateOrganizationDto {

    public UpdateOrganizationDto() {
    }

    public UpdateOrganizationDto(String category, Set<String> tags) {
        this.category = category;
        this.tags = tags;
    }
    private String category;
    private Set<String> tags;
}
