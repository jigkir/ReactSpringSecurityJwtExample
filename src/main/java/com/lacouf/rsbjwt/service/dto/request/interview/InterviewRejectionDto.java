package com.lacouf.rsbjwt.service.dto.request.interview;

import jakarta.validation.constraints.NotBlank;

public record InterviewRejectionDto(
        @NotBlank String comment
) {
}
