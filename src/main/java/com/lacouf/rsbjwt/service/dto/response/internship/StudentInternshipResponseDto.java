package com.lacouf.rsbjwt.service.dto.response.internship;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.lacouf.rsbjwt.model.internship.Internship;

public record StudentInternshipResponseDto(
        @JsonUnwrapped InternshipResponseDto internship,
        boolean viewed,
        boolean hidden,
        boolean favorite
) {
    public static StudentInternshipResponseDto of(Internship internship, boolean viewed, boolean hidden, boolean favorite) {
        return new StudentInternshipResponseDto(InternshipResponseDto.of(internship), viewed, hidden, favorite);
    }
}
