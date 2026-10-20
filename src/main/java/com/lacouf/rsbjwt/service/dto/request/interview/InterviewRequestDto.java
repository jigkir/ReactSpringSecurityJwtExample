package com.lacouf.rsbjwt.service.dto.request.interview;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record InterviewRequestDto (

    @NotBlank
    @Size(min = 2, max = 500)
    String message,

    @NotNull
    @Future
    LocalDateTime interviewDate
) {
}
