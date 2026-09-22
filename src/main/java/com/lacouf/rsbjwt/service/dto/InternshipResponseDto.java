package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Internship;
import com.lacouf.rsbjwt.model.InternshipStatus;

import java.time.LocalDate;

public record InternshipResponseDto(
        Long id,
        String title,
        String description,
        String requiredSkills,
        String duration,
        String location,
        LocalDate  startDate,
        LocalDate deadline,
        String compensation,
        InternshipStatus status,
        Boolean isDeleted,
        Long employerId
) {
    public static InternshipResponseDto of(Internship internship){
        return new InternshipResponseDto(internship.getId(),internship.getTitle(),internship.getDescription(),internship.getRequiredSkills(),internship.getDuration(),internship.getLocation(),internship.getStartDate(),internship.getDeadline(),internship.getCompensation(),internship.getStatus(),internship.getIsDeleted(),internship.getPostedBy().getId());
    }
}
