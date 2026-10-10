package com.lacouf.rsbjwt.service.dto.response.cv;

import com.lacouf.rsbjwt.model.cv.*;

import java.time.LocalDateTime;

public record StudentCvResponseDto(
        long id,
        String fileName,
        long sizeBytes,
        LocalDateTime uploadedAt,
        CvVisibility visibility,
        CvStatus status,
        String rejectionComment
) {
    public static StudentCvResponseDto of(CV cv) {
        return new StudentCvResponseDto(
                cv.getId(),
                cv.getFileName(),
                cv.getContent() != null ? cv.getContent().length : 0,
                cv.getUploadDate(),
                cv.getVisibility(),
                cv.getStatus(),
                cv.getRejectionComment()
        );
    }
}