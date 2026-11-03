package com.lacouf.rsbjwt.service.dto.response.application;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.StudentCvResponseDto;

import java.time.LocalDate;

public record InternshipApplicationResponseDto(
        long id,
        long internshipId,
        String internshipTitle,
        StudentCvResponseDto cv,
        DocumentResponseDto coverLetter,
        DocumentResponseDto academicTranscript,
        LocalDate applicationDate,
        InternshipApplicationStatus internshipApplicationStatus
) {

    public static InternshipApplicationResponseDto of(InternshipApplication internshipApplication) {
        Internship internship = internshipApplication.getInternship();

        return new InternshipApplicationResponseDto(
                internshipApplication.getId(),
                internship.getId(),
                internship.getTitle(),
                StudentCvResponseDto.of(internshipApplication.getCv()),
                toDocumentResponse(internshipApplication.getCoverLetter()),
                toDocumentResponse(internshipApplication.getAcademicTranscript()),
                internshipApplication.getApplicationDate(),
                internshipApplication.getInternshipApplicationStatus()
        );
    }


    private static DocumentResponseDto toDocumentResponse(Document document) {
        return document == null ? null : DocumentResponseDto.of(document);
    }
}
