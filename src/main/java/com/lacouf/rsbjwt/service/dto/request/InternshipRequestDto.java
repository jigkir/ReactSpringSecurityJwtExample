package com.lacouf.rsbjwt.service.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
public record InternshipRequestDto(
        @NotBlank
        @Size(min = 2, max = 50)
        String title,

        @NotBlank
        @Size(min = 2)
        String description,

        @NotBlank
        @Size(min = 2)
        String requiredSkills,

        @NotNull
        @Min(1)
        Integer durationInWeeks,

        @NotBlank
        @Size(min = 2)
        String location,

        @NotNull
        @Future
        LocalDate startDate,

        @NotNull
        @Future
        LocalDate applicationDeadline,

        @PositiveOrZero
        @Digits(integer=2, fraction=2)
        BigDecimal compensationAmount,

        boolean compensationNegotiable
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
    }
}
