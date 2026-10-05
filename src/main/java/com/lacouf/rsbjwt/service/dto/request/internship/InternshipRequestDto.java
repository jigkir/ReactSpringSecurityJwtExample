package com.lacouf.rsbjwt.service.dto.request.internship;

import com.lacouf.rsbjwt.model.internship.WorkMode;
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
        WorkMode workMode,

        @NotNull
        LocalDate startDate,

        @NotNull
        LocalDate applicationDeadline,

        @PositiveOrZero
        @Digits(integer = 2, fraction = 2)
        BigDecimal compensationAmount,

        boolean compensationNegotiable
) {
    public InternshipRequestDto {
        if (title != null) title = title.strip();
        if (location != null) location = location.strip();

        if (description != null) description = description.strip();

        if (requiredSkills != null) {
            requiredSkills = java.util.Arrays.stream(requiredSkills.split("[,;\\n]"))
                    .map(String::strip)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(java.util.stream.Collectors.joining(", "));
        }
    }
}