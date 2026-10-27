package com.lacouf.rsbjwt.service.dto.response.document.student.cv;

import com.lacouf.rsbjwt.model.documents.student.cv.CV;
import com.lacouf.rsbjwt.model.ReviewStatus;

import java.time.LocalDateTime;

public record ManagerCvResponseDto(
        long id,
        String fileName,
        LocalDateTime uploadedAt,
        ReviewStatus status,
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
