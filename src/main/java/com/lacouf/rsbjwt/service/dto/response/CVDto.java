package com.lacouf.rsbjwt.service.dto.response;

import com.lacouf.rsbjwt.model.cv.*;

import java.time.LocalDateTime;

public record CVDto(
        byte[] content,
        Long id,
        CVSharingScope sharingScope,
        String fileName,
        long sizeBytes,
        LocalDateTime uploadedAt,
        CvPriority priority,
        CvVisibility visibility,
        CvStatus status
) {
    public static CVDto fromCV(CV cv) {
        return new CVDto(
                cv.getContent(),
                cv.getId(),
                cv.getSharingScope(),
                cv.getFileName(),
                cv.getContent() != null ? cv.getContent().length : 0,
                cv.getUploadDate(),
                cv.getPriority(),
                cv.getVisibility(),
                cv.getStatus()
        );
    }

    public byte[] getContent() { return content; }

    public CV toCV() {
        return new CV(content, CvVisibility.VISIBLE, CVSharingScope.PRIVATE, CvPriority.SECONDARY, fileName, LocalDateTime.now());
    }
}