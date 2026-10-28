package com.lacouf.rsbjwt.service.dto.request.document.student.cv;

import jakarta.validation.constraints.NotBlank;

public record CvRejectionDto(
        @NotBlank
        String comment
) {
    public CvRejectionDto {
        if (comment != null) comment = comment.trim();
    }
}
