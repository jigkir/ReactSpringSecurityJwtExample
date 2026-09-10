package com.lacouf.rsbjwt.service.dto;

public record EmployerDTO (
        String firstName,
        String lastName,
        String email,
        String password,
        String companyName,
        String activitySector,
        String phoneNumber
) {

}
