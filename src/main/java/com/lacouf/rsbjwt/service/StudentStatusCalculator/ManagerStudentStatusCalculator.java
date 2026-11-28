package com.lacouf.rsbjwt.service.StudentStatusCalculator;

import com.lacouf.rsbjwt.service.dto.response.user.ManagerStudentSummaryDto.InternshipStatus;

import static com.lacouf.rsbjwt.service.dto.response.user.ManagerStudentSummaryDto.InternshipStatus.*;

public final class ManagerStudentStatusCalculator {

    private ManagerStudentStatusCalculator() {}

    public record StudentActivity(
            long cvCount, long cvApproved, long cvPending,
            long applications, long upcomingInterviews, long awaitingDecision,
            long offersPending, long contractsToSign, long signedContracts) {}

    public static InternshipStatus computeStatus(StudentActivity a) {
        if (a.signedContracts() > 0)     return CONTRACT_SIGNED;
        if (a.contractsToSign() > 0)     return CONTRACT_PENDING;
        if (a.offersPending() > 0)       return OFFER_PENDING;
        if (a.awaitingDecision() > 0)    return AWAITING_DECISION;
        if (a.upcomingInterviews() > 0)  return UPCOMING_INTERVIEW;
        if (a.applications() > 0)        return NO_INTERVIEW;
        if (a.cvApproved() > 0)          return NO_APPLICATION;
        if (a.cvPending() > 0)           return CV_PENDING;
        if (a.cvCount() > 0)             return CV_REJECTED;
        return NO_CV;
    }
}
