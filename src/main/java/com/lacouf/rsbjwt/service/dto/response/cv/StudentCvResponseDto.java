package com.lacouf.rsbjwt.service.dto.response.cv;

import com.lacouf.rsbjwt.model.cv.*;

import java.time.LocalDateTime;

public record StudentCvResponseDto(
        long id,
        CVSharingScope sharingScope,
        String fileName,
        long sizeBytes,
        LocalDateTime uploadedAt,
        CvPriority priority,
        CvVisibility visibility,
        CvStatus status,
        String rejectionComment
) {
    public static StudentCvResponseDto of(CV cv) {
        return new StudentCvResponseDto(
                cv.getId(),
                cv.getSharingScope(),
                cv.getFileName(),
                cv.getContent() != null ? cv.getContent().length : 0,
                cv.getUploadDate(),
                cv.getPriority(),
                cv.getVisibility(),
                cv.getStatus(),
                cv.getRejectionComment()
        );
    }
}