package com.lacouf.rsbjwt.service.dto.response.interview;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.user.Student;

public record InterviewEmployerResponseDTO(
    Long id,
    String studentName,
    String internshipTitle,
    String message,
    String studentDecision,
    String interviewDate
) {
    public static InterviewEmployerResponseDTO of(Interview interview) {
        InternshipApplication application = interview.getInternshipApplication();
        Student student = application.getStudent();

        return new InterviewEmployerResponseDTO(
                interview.getId(),
                student.getFirstName() + " " + student.getLastName(),
                application.getInternship().getTitle(),
                interview.getMessage(),
                interview.getStudentDecision().name(),
                interview.getInterviewDate().toString()
        );
    }
}
