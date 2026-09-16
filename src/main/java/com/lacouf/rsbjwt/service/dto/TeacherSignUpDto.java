package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Discipline;
import jakarta.validation.constraints.*;

public record TeacherSignUpDto(
        @NotBlank
        @Size(min = 2, max = 50)
        String firstName,

        @NotBlank
        @Size(min = 2, max = 50)
        String lastName,

        @NotBlank
        @Size(max = 20)
        @Pattern(regexp = "^[0-9]*$", message = "teacher ID must contain only digits")
        String teacherId,

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(min = 8, max = 50)
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])\\S+$", message = "password must contain at least one digit, one lowercase, one uppercase, one special character (@#$%^&+=), and must not contain whitespace")
        String password,

        @NotNull
        Discipline discipline) {
        public TeacherSignUpDto {
                if (firstName != null) {
                        firstName = firstName.trim();
                }

                if (lastName != null) {
                        lastName = lastName.trim();
                }

                if (email != null) {
                        email = email.trim().toLowerCase();
                }

                if (teacherId != null) {
                        teacherId = teacherId.trim().toLowerCase();
                }
        }
}
