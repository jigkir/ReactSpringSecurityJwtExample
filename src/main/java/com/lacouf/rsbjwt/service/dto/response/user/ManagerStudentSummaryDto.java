package com.lacouf.rsbjwt.service.dto.response.user;

public record ManagerStudentSummaryDto(
        long studentId,
        String firstName,
        String lastName,
        AccountStatusResponseDto accountStatus,

        long numberOfCVs,
        long numberOfCVsPending,
        long numberOfCVsDenied,

        long numberOfApplications,
        long numberOfInterviews,
        long numberOfUpcomingInterviews,
        long numberOfInterviewsCompletedAndAwaitingAnswer,

        long numberOfOffersPending,
        boolean hasFoundAnInternship,
        boolean hasToSignAContract,
        boolean hasSignedContract
) {}