package com.lacouf.rsbjwt.service.dto.response.interview;

public record InterviewStudentResponseDTO(
    Long id,
    String employerName,
    String internshipTitle,
    String message,
    String studentDecision,
    String interviewDate
) {
}
