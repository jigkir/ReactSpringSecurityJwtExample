package com.lacouf.rsbjwt.service.dto.response.user;

public record ManagerStudentSummaryDto(
        long id,
        String studentId,
        String firstName,
        String lastName,
        AccountStatusResponseDto accountStatus,
        InternshipStatus internshipStatus
) {
    public enum InternshipStatus {
        NO_CV, CV_PENDING, CV_REJECTED, NO_APPLICATION, NO_INTERVIEW,
        UPCOMING_INTERVIEW, AWAITING_DECISION, OFFER_PENDING,
        CONTRACT_PENDING, CONTRACT_SIGNED
    }
}