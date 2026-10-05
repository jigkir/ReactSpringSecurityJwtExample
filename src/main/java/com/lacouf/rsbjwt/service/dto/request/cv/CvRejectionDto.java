package com.lacouf.rsbjwt.service.dto.request.cv;

import jakarta.validation.constraints.NotBlank;

public record CvRejectionDto(
        @NotBlank
        String comment
) {
    public CvRejectionDto {
        if (comment != null) comment = comment.trim();
    }
}
