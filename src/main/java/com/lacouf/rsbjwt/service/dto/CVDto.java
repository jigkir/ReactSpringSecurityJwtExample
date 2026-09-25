package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.CVSharingScope;
import com.lacouf.rsbjwt.model.CvPriority;
import com.lacouf.rsbjwt.model.CvVisibility;

import java.time.LocalDateTime;

public record CVDto(
        byte[] content,
        Long id,
        CVSharingScope sharingScope,
        String fileName,
        long sizeBytes,
        LocalDateTime uploadedAt,
        CvPriority priority,
        CvVisibility visibility
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
                cv.getVisibility()
        );
    }

    public byte[] getContent() { return content; }

    public CV toCV() {
        return new CV(content, CvVisibility.VISIBLE, CVSharingScope.PRIVATE, CvPriority.SECONDARY, fileName, LocalDateTime.now());
    }
}