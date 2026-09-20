package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Discipline;
import jakarta.validation.constraints.*;

public record EmployerSignUpDto(
        @NotBlank
        @Size(min = 2, max = 50)
        String firstName,

        @NotBlank
        @Size(min = 2, max = 50)
        String lastName,

        @NotBlank
        @Email
        @Size(max = 100)
        String email,

        @NotBlank
        @Size(min = 8, max = 50)
        @Pattern(regexp = "^(?!.*\\s)(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).+$", message = "password must contain at least one digit, one lowercase, one uppercase, one special character (@#$%^&+=!), and must not contain whitespace")
        String password,

        @NotBlank
        @Size(min = 2, max = 100)
        String companyName,

        @NotNull
        Discipline discipline,

        @NotBlank
        @Pattern(regexp = "^[0-9]{10}$", message = "phone number must contain exactly 10 digits")
        String phoneNumber
) {

        public EmployerSignUpDto {
                if (firstName != null) {
                        firstName = firstName.trim();
                }

                if (lastName != null) {
                        lastName = lastName.trim();
                }

                if (email != null) {
                        email = email.trim().toLowerCase();
                }

                if (companyName != null) {
                        companyName = companyName.trim();
                }

                if (phoneNumber != null) {
                        phoneNumber = phoneNumber.trim();
                }
        }
}
