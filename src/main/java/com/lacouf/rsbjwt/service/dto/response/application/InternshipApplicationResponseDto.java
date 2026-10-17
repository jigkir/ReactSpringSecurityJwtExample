package com.lacouf.rsbjwt.service.dto.response.application;

import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;

import java.time.LocalDate;

public record InternshipApplicationResponseDto(long id, long internshipId,
                                               String internshipTitle,
                                               StudentCvResponseDto cv,
                                               LocalDate applicationDate,
                                               InternshipApplicationStatus internshipApplicationStatus) {

    public static InternshipApplicationResponseDto of(long id, long internshipId, String internshipTitle, StudentCvResponseDto cv, LocalDate applicationDate, InternshipApplicationStatus internshipApplicationStatus) {
        return new InternshipApplicationResponseDto(id, internshipId, internshipTitle, cv, applicationDate, internshipApplicationStatus);
    }
}
