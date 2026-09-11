package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Discipline;
import jakarta.validation.constraints.*;

public record StudentRegistrationDto(
        @NotBlank
        @Size(min = 2, max = 50)
        String firstName,

        @NotBlank
        @Size(min = 2, max = 50)
        String lastName,

        @NotBlank
        @Pattern(regexp = "^[0-9]*$", message = "student ID must contain only digits")
        String studentId,

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(min = 8, max = 50)
        String password,

        @NotNull
        Discipline discipline) {
}
