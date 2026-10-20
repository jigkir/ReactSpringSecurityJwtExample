package com.lacouf.rsbjwt.service.dto.request.internship;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ViewedInternshipsDto(@NotEmpty List<Long> internshipIds) {
}