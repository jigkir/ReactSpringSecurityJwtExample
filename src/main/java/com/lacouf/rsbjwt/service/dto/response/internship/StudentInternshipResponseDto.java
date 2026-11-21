package com.lacouf.rsbjwt.service.dto.response.internship;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.TranslatedContent;

public record StudentInternshipResponseDto(
        @JsonUnwrapped InternshipResponseDto internship,
        boolean viewed,
        boolean hidden,
        boolean favorite
) {
    public static StudentInternshipResponseDto of(Internship internship, boolean viewed, boolean hidden, boolean favorite) {
        return of(internship, viewed, hidden, favorite, null);
    }

    public static StudentInternshipResponseDto of(Internship internship, boolean viewed, boolean hidden, boolean favorite, TranslatedContent translation) {
        return new StudentInternshipResponseDto(InternshipResponseDto.of(internship, translation), viewed, hidden, favorite);
    }
}