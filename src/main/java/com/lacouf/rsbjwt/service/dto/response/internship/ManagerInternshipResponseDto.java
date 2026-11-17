package com.lacouf.rsbjwt.service.dto.response.internship;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.lacouf.rsbjwt.model.internship.Internship;

public record ManagerInternshipResponseDto(
        @JsonUnwrapped InternshipResponseDto internship,
        boolean hasApplications
) {
    public static ManagerInternshipResponseDto of(Internship internship, boolean hasApplications) {
        return new ManagerInternshipResponseDto(InternshipResponseDto.of(internship), hasApplications);
    }
}