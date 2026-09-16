package com.lacouf.rsbjwt.service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmployerRegistrationDto (
        @NotBlank(message = "Le prénom est obligatoire")
        @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
        String firstName,

        @NotBlank(message = "Le nom est obligatoire")
        @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
        String lastName,

        @NotBlank(message = "L'email est obligatoire")
        @Email
        String email,

        @NotBlank
        @Size(min = 8, max = 50, message = "Le mot de passe doit contenir entre 8 et 50 caractères")
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])\\S+$", message = "password must contain at least one digit, one lowercase, one uppercase, one special character (@#$%^&+=), and must not contain whitespace")
        String password,

        @NotBlank
        @Size(min = 2, max = 100, message = "Le nom de l'entreprise doit contenir entre 2 et 100 caractères")
        String companyName,

        @NotBlank
        @Size(min = 2, max = 30, message = "Le secteur d'activité doit contenir entre 2 et 30 caractères")
        String activitySector,

        @NotBlank
        @Size(min = 10, max = 20, message = "Le numéro de téléphone doit contenir entre 10 et 20 caractères")
        String phoneNumber
) {

        public EmployerRegistrationDto {
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

                if (activitySector != null) {
                        activitySector = activitySector.trim();
                }

                if (phoneNumber != null) {
                        phoneNumber = phoneNumber.trim();
                }
        }
}
