package com.lacouf.rsbjwt.service.dto.response.document.student.cv;

import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.document.student.cv.TranslatedContent;
import com.lacouf.rsbjwt.service.dto.response.user.StudentSummaryDto;

import java.time.LocalDateTime;

public record ManagerCvResponseDto(
        long id,
        String fileName,
        LocalDateTime uploadedAt,
        ReviewStatus status,
        String rejectionComment,
        StudentSummaryDto student,
        boolean usedInApplication
) {
    public static ManagerCvResponseDto of(CV cv, boolean usedInApplication) {
        return new ManagerCvResponseDto(
                cv.getId(),
                cv.getFileName(),
                cv.getUploadDate(),
                cv.getStatus(),
                cv.getRejectionComment(),
                StudentSummaryDto.of(cv.getStudent()),
                usedInApplication
        );
    }

    public static ManagerCvResponseDto of(CV cv, boolean usedInApplication, TranslatedContent translation) {
        ManagerCvResponseDto base = of(cv, usedInApplication);
        if (translation == null) return base;

        return new ManagerCvResponseDto(
                base.id(),
                base.fileName(),
                base.uploadedAt(),
                base.status(),
                translation.getRejectionComment(),
                base.student(),
                base.usedInApplication()
        );
    }
}
