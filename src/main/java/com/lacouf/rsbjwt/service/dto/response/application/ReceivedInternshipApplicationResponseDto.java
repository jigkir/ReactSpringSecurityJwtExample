package com.lacouf.rsbjwt.service.dto.response.application;

import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentSummaryDto;

import java.time.LocalDate;

public record ReceivedInternshipApplicationResponseDto(
        long id,
        long internshipId,
        String internshipTitle,
        StudentSummaryDto student,
        long cvId,
        String cvFileName,
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
                internshipApplication.getApplicationDate(),
                internshipApplication.getInternshipApplicationStatus(),
                internshipApplication.getEmployerDecision()
        );
    }
}
