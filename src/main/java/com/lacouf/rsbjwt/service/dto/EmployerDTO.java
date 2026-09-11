package com.lacouf.rsbjwt.service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmployerDTO (
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
        String password,

        @NotBlank
        @Size(min = 2, max = 100, message = "Le nom de l'entreprise doit contenir entre 2 et 100 caractères")
        String companyName,

        @NotBlank
        String activitySector,

        @NotBlank
        String phoneNumber
) {

}
