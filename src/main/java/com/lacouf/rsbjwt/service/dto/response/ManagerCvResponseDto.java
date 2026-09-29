package com.lacouf.rsbjwt.service.dto.response;

import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.cv.CvStatus;

import java.time.LocalDateTime;

public record ManagerCvResponseDto(
        long id,
        String fileName,
        LocalDateTime uploadedAt,
        CvStatus status,
        String rejectionComment,
        StudentSummaryDto student
) {
    public static ManagerCvResponseDto of(CV cv) {
        return new ManagerCvResponseDto(
                cv.getId(),
                cv.getFileName(),
                cv.getUploadDate(),
                cv.getStatus(),
                cv.getRejectionComment(),
                StudentSummaryDto.of(cv.getStudent())
        );
    }
}
