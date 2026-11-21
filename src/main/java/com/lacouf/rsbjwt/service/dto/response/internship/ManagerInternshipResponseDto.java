package com.lacouf.rsbjwt.service.dto.response.internship;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.TranslatedContent;

public record ManagerInternshipResponseDto(
        @JsonUnwrapped InternshipResponseDto internship,
        boolean hasApplications
) {
    public static ManagerInternshipResponseDto of(Internship internship, boolean hasApplications) {
        return of(internship, hasApplications, null);
    }

    public static ManagerInternshipResponseDto of(Internship internship, boolean hasApplications, TranslatedContent translation) {
        return new ManagerInternshipResponseDto(InternshipResponseDto.of(internship, translation), hasApplications);
    }
}