package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Discipline;
import jakarta.validation.constraints.*;

public record StudentSignUpDto(
        @NotBlank
        @Size(min = 2, max = 50)
        @Pattern(regexp = "^(?=.*\\p{L})[\\p{L}\\p{M}'’\\-. ]+$", message = "must contain at least one letter and only letters, spaces, hyphens, apostrophes and periods")
        String firstName,

        @NotBlank
        @Size(min = 2, max = 50)
        @Pattern(regexp = "^(?=.*\\p{L})[\\p{L}\\p{M}'’\\-. ]+$", message = "must contain at least one letter and only letters, spaces, hyphens, apostrophes and periods")
        String lastName,

        @NotBlank
        @Pattern(regexp = "^[0-9]{7}$", message = "student ID must contain 7 digits")
        String studentId,

        @NotBlank
        @Size(max = 100)
        @Email(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "invalid email format")
        String email,

        @NotBlank
        @Size(min = 8, max = 50)
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!\"#$%&'()*+,\\-./:;<=>?@\\[\\\\\\]^_`{|}~])\\S+$", message = "password must contain at least one digit, one lowercase, one uppercase, one special character, and must not contain whitespace")
        String password,

        @NotNull
        Discipline discipline
) {

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
