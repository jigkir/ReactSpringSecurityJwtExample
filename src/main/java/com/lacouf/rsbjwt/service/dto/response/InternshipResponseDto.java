package com.lacouf.rsbjwt.service.dto.response;

import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.InternshipStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InternshipResponseDto(
        long id,
        String title,
        String description,
        String requiredSkills,
        int durationInWeeks,
        String location,
        LocalDate startDate,
        LocalDate applicationDeadline,
        BigDecimal compensationAmount,
        boolean compensationNegotiable,
        InternshipStatus status,
        long employerId,
        String rejectionComment
) {
    public static InternshipResponseDto of(Internship internship){
        return new InternshipResponseDto(
                internship.getId(),
                internship.getTitle(),
                internship.getDescription(),
                internship.getRequiredSkills(),
                internship.getDurationInWeeks(),
                internship.getLocation(),
                internship.getStartDate(),
                internship.getApplicationDeadline(),
                internship.getCompensationAmount(),
                internship.isCompensationNegotiable(),
                internship.getStatus(),
                internship.getPostedBy().getId(),
                internship.getRejectionComment()
        );
    }
}