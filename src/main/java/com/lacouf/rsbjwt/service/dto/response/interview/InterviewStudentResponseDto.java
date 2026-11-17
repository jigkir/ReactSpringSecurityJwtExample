package com.lacouf.rsbjwt.service.dto.response.interview;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.lacouf.rsbjwt.model.interview.Interview;

public record InterviewStudentResponseDto(
        @JsonUnwrapped InterviewResponseDto interview,
        String employerName
) {
    public static InterviewStudentResponseDto of(Interview interview) {
        return new InterviewStudentResponseDto(InterviewResponseDto.of(interview), interview.getEmployer().getCompanyName());
    }
}