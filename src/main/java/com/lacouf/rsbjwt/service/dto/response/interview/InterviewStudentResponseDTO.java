package com.lacouf.rsbjwt.service.dto.response.interview;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.user.Employer;

public record InterviewStudentResponseDTO(
    Long id,
    Long applicationId,
    String employerName,
    String internshipTitle,
    String message,
    String studentDecision,
    String interviewDate,
    String meetingType,
    String meetingDetails,
    String interviewStatus
) {
    public static InterviewStudentResponseDTO of(Interview interview) {
        InternshipApplication application = interview.getInternshipApplication();
        Employer employer = interview.getEmployer();

        return new InterviewStudentResponseDTO(
                interview.getId(),
                application.getId(),
                employer.getCompanyName(),
                application.getInternship().getTitle(),
                interview.getMessage(),
                interview.getStudentDecision().name(),
                interview.getInterviewDate().toString(),
                interview.getMeetingType().name(),
                interview.getMeetingDetails(),
                interview.getInterviewStatus().name()
        );
    }
}
