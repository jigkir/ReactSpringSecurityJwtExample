package com.lacouf.rsbjwt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record InternshipDto(
        Long id,

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
        @Pattern(regexp = "(?i)^\\\\$\\\\d+(\\\\.\\\\d+)?/h$|^unpaid$|^non\\\\s*rémunéré$", message = "Compensation must be a valid format (e.g., $20/h, unpaid, or non rémunéré)")
        String compensation,

        String status,

        Boolean isDeleted,

        Long employerId
) {
    public InternshipDto {
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