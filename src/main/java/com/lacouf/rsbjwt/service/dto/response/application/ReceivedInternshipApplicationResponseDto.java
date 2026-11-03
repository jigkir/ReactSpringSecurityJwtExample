package com.lacouf.rsbjwt.service.dto.response.application;

import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.service.dto.response.user.StudentSummaryDto;

import java.time.LocalDate;

public record ReceivedInternshipApplicationResponseDto(
        long id,
        long internshipId,
        String internshipTitle,
        StudentSummaryDto student,
        long cvId,
        String cvFileName,
        Long coverLetterId,
        String coverLetterFileName,
        Long transcriptId,
        String transcriptFileName,
        LocalDate applicationDate,
        InternshipApplicationStatus internshipApplicationStatus,
        EmployerDecision employerDecision
) {

    public static ReceivedInternshipApplicationResponseDto of(InternshipApplication internshipApplication) {
        Internship internship = internshipApplication.getInternship();
        CV cv = internshipApplication.getCv();

        return new ReceivedInternshipApplicationResponseDto(
                internshipApplication.getId(),
                internship.getId(),
                internship.getTitle(),
                StudentSummaryDto.of(internshipApplication.getStudent()),
                cv.getId(),
                cv.getFileName(),
                idOf(internshipApplication.getCoverLetter()),
                fileNameOf(internshipApplication.getCoverLetter()),
                idOf(internshipApplication.getAcademicTranscript()),
                fileNameOf(internshipApplication.getAcademicTranscript()),
                internshipApplication.getApplicationDate(),
                internshipApplication.getInternshipApplicationStatus(),
                internshipApplication.getEmployerDecision()
        );
    }

    private static Long idOf(Document document) {
        return document == null ? null : document.getId();
    }

    private static String fileNameOf(Document document) {
        return document == null ? null : document.getFileName();
    }
}
