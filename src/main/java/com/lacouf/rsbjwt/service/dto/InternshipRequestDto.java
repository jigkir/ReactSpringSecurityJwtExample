package com.lacouf.rsbjwt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record InternshipRequestDto(
        @NotBlank
        @Size(min = 2, max = 50)
        @Pattern(regexp = "^(?=.*\\p{L})[\\p{L}\\p{M}'’\\-. ]+$", message = "Title must contain at least one letter and only letters, spaces, hyphens, apostrophes and periods")
        String title,

        @NotBlank
        @Size(min = 2, max = 255)
        @Pattern(regexp = "^(?=.*\\p{L})[\\p{L}\\p{M}'’\\-. ]+$", message = "Description must contain at least one letter and only letters, spaces, hyphens, apostrophes and periods")
        String description,

        @NotBlank
        String requiredSkills,

        @NotBlank
        String duration,

        @NotBlank
        String location,

        @NotBlank
        String startDate,

        @NotBlank
        String deadline,

        @NotBlank
        String compensation,

        String status,

        Boolean isDeleted,

        Long employerId
) {
    public InternshipRequestDto {
        if (title != null) {
            title = title.trim();
        }

        if (description != null) {
            description = description.trim();
        }

        if (requiredSkills != null) {
            requiredSkills = requiredSkills.trim();
        }

        if (location != null) {
            location = location.trim();
        }

        if (compensation != null) {
            compensation = compensation.trim();
        }
    }
}
