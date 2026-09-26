package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Internship;
import com.lacouf.rsbjwt.model.InternshipStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;

public record InternshipResponseDto(
        long id,
        String title,
        String description,
        String requiredSkills,
        Period durationInWeeks,
        String location,
        LocalDate startDate,
        LocalDate applicationDeadline,
        BigDecimal compensationAmount,
        boolean compensationNegotiable,
        InternshipStatus status,
        long employerId
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
                internship.getPostedBy().getId()
        );
    }
}
