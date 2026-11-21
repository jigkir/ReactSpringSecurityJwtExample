package com.lacouf.rsbjwt.service.dto.response.interview;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.interview.InterviewCancellationReason;

public record InterviewResponseDto(
        Long id,
        Long applicationId,
        String internshipTitle,
        String message,
        String studentDecision,
        String interviewDate,
        String meetingType,
        String meetingDetails,
        String interviewStatus,
        String rejectionMessage,
        String employerPhoneNumber,
        InterviewCancellationReason cancellationReason
) {
    public static InterviewResponseDto of(Interview interview) {
        InternshipApplication application = interview.getInternshipApplication();
        Internship internship = application.getInternship();

        return new InterviewResponseDto(
                interview.getId(),
                application.getId(),
                internship.getTitle(),
                interview.getMessage(),
                interview.getStudentDecision().name(),
                interview.getInterviewDate().toString(),
                interview.getMeetingType().name(),
                interview.getMeetingDetails(),
                interview.getInterviewStatus().name(),
                interview.getRejectionMessage(),
                interview.getEmployer().getPhoneNumber(),
                interview.getCancellationReason()
        );
    }
}