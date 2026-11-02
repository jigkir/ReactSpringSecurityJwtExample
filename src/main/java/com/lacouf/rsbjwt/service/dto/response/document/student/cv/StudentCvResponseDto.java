package com.lacouf.rsbjwt.service.dto.response.document.student.cv;

import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.document.student.cv.CV;

import java.time.LocalDateTime;

public record StudentCvResponseDto(
        long id,
        String fileName,
        long sizeBytes,
        LocalDateTime uploadedAt,
        DocumentVisibility visibility,
        ReviewStatus status,
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