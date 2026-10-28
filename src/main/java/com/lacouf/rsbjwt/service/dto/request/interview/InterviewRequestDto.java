package com.lacouf.rsbjwt.service.dto.request.interview;

import com.lacouf.rsbjwt.model.interview.MeetingType;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public record InterviewRequestDto (

    @NotBlank
    @Size(min = 2, max = 500)
    String message,

    @NotNull
    @FutureOrPresent
    LocalDateTime interviewDate,

    @NotNull
    MeetingType meetingType,

    @NotNull
    @Size(min = 2, max = 255)
    String meetingDetails
) {
}
