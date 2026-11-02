package com.lacouf.rsbjwt.service.dto.response.document.student.cv;

import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.service.dto.response.user.StudentSummaryDto;

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
