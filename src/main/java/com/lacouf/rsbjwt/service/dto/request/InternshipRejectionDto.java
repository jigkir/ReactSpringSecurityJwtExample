package com.lacouf.rsbjwt.service.dto.request;
import jakarta.validation.constraints.NotBlank;

public record InternshipRejectionDto(@NotBlank String comment) {
    public InternshipRejectionDto {
        if (comment != null) comment = comment.trim();
    }
}