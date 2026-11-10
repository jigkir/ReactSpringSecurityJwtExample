package com.lacouf.rsbjwt.service.dto.request.interview;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record InterviewReschedulingDto(
        String comment,
        @NotNull
        @FutureOrPresent
        LocalDateTime interviewDate
) {
}
