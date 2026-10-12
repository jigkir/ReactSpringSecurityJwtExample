package com.lacouf.rsbjwt.service.dto.response.application;

import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;

import java.time.LocalDate;

public record InternshipApplicationResponseDto(long id, CvFileResponseDto cv, LocalDate applicationDate) {
    public static InternshipApplicationResponseDto of(long id, CvFileResponseDto cv, LocalDate applicationDate) {
        return new InternshipApplicationResponseDto(id, cv, applicationDate);
    }
}
