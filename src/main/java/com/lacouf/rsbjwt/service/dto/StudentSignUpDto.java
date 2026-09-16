package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Discipline;
import jakarta.validation.constraints.*;

public record StudentSignUpDto(
        @NotBlank
        @Size(min = 2, max = 50)
        String firstName,

        @NotBlank
        @Size(min = 2, max = 50)
        String lastName,

        @NotBlank
        @Size(max = 20)
        @Pattern(regexp = "^[0-9]*$", message = "student ID must contain only digits")
        String studentId,

        @NotBlank
        @Email
        @Size(max = 100)
        String email,

        @NotBlank
        @Size(min = 8, max = 50)
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!?])\\S+$", message = "password must contain at least one digit, one lowercase, one uppercase, one special character (@#$%^&+=), and must not contain whitespace")
        String password,

        @NotNull
        Discipline discipline) {

        public StudentSignUpDto {
                if (firstName != null) {
                        firstName = firstName.trim();
                }

                if (lastName != null) {
                        lastName = lastName.trim();
                }

                if (email != null) {
                        email = email.trim().toLowerCase();
                }

                if (studentId != null) {
                        studentId = studentId.trim().toLowerCase();
                }
        }
}
