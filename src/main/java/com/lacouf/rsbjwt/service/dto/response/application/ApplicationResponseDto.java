package com.lacouf.rsbjwt.service.dto.response.application;

import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;

import java.time.LocalDate;

public record ApplicationResponseDto (long id, CvFileResponseDto cv, LocalDate applicationDate) {
    public static ApplicationResponseDto of(long id, CvFileResponseDto cv, LocalDate applicationDate) {
        return new ApplicationResponseDto(id, cv, applicationDate);
    }
}
