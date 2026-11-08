package com.lacouf.rsbjwt.service.dto.response.session;

import com.lacouf.rsbjwt.model.session.AcademicSession;

import java.time.LocalDate;

public record AcademicSessionResponseDto(
        long id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        boolean target
) {
    public static AcademicSessionResponseDto of(AcademicSession session, boolean target) {
        return new AcademicSessionResponseDto(session.getId(), session.getName(), session.getStartDate(), session.getEndDate(), target);
    }
}
