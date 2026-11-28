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
    String meetingDetails,

    @Pattern(regexp = "^[0-9]{10}$", message = "phone number must contain exactly 10 digits")
    String interviewPhoneNumber
) {
    public InterviewRequestDto {
        if (interviewPhoneNumber != null) {
            interviewPhoneNumber = interviewPhoneNumber.trim();
            if (interviewPhoneNumber.isEmpty()) interviewPhoneNumber = null;
        }
    }
}
