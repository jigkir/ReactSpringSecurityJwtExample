package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Discipline;

public record StudentRegistrationDto(String firstName, String lastName, String studentId, String email, String password, Discipline discipline) {
}
