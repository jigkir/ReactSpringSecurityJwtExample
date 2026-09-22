package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.InternshipStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record InternshipRequestDto(
        @NotBlank
        @Size(min = 2, max = 50)
        String title,

        @NotBlank
        @Size(min = 2, max = 255)
        String description,

        @NotBlank
        String requiredSkills,

        @NotBlank
        String duration,

        @NotBlank
        String location,

        @NotNull
        LocalDate startDate,

        @NotNull
        LocalDate deadline,

        @NotBlank
        String compensation,

        InternshipStatus status,

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
