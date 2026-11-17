package com.lacouf.rsbjwt.service.dto.response.interview;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.lacouf.rsbjwt.model.interview.Interview;

public record InterviewEmployerResponseDto(
        @JsonUnwrapped InterviewResponseDto interview,
        String studentName
) {
    public static InterviewEmployerResponseDto of(Interview interview) {
        return new InterviewEmployerResponseDto(InterviewResponseDto.of(interview), interview.getInternshipApplication().getStudent().getFullName());
    }
}