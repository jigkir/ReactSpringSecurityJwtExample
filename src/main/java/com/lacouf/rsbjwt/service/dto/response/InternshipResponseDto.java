package com.lacouf.rsbjwt.service.dto.response;

import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.InternshipStatus;
import com.lacouf.rsbjwt.model.internship.WorkMode;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InternshipResponseDto(
        long id,
        String title,
        String description,
        String requiredSkills,
        int durationInWeeks,
        String location,
        WorkMode workMode,
        LocalDate startDate,
        LocalDate applicationDeadline,
        BigDecimal compensationAmount,
        boolean compensationNegotiable,
        InternshipStatus status,
        String rejectionComment,
        long employerId
) {
    public static InternshipResponseDto of(Internship internship) {
        return new InternshipResponseDto(
                internship.getId(),
                internship.getTitle(),
                internship.getDescription(),
                internship.getRequiredSkills(),
                internship.getDurationInWeeks(),
                internship.getLocation(),
                internship.getWorkMode(),
                internship.getStartDate(),
                internship.getApplicationDeadline(),
                internship.getCompensationAmount(),
                internship.isCompensationNegotiable(),
                internship.getStatus(),
                internship.getRejectionComment(),
                internship.getPostedBy().getId()
        );
    }
}
