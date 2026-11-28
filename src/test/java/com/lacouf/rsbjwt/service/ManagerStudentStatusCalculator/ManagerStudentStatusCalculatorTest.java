package com.lacouf.rsbjwt.service.ManagerStudentStatusCalculator;

import org.junit.jupiter.api.Test;

import static com.lacouf.rsbjwt.service.StudentStatusCalculator.ManagerStudentStatusCalculator.computeStatus;
import static com.lacouf.rsbjwt.service.dto.response.user.ManagerStudentSummaryDto.InternshipStatus.*;
import static com.lacouf.rsbjwt.service.StudentStatusCalculator.ManagerStudentStatusCalculator.StudentActivity;
import static org.junit.jupiter.api.Assertions.assertEquals;

class ManagerStudentStatusCalculatorTest {

    private static StudentActivity none() {
        return new StudentActivity(0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    @Test
    void noCv() {
        assertEquals(NO_CV, computeStatus(none()));
    }

    @Test
    void cvRejected() {
        assertEquals(CV_REJECTED, computeStatus(new StudentActivity(1, 0, 0, 0, 0, 0, 0, 0, 0)));
    }

    @Test
    void cvPending() {
        assertEquals(CV_PENDING, computeStatus(new StudentActivity(1, 0, 1, 0, 0, 0, 0, 0, 0)));
    }

    @Test
    void noApplication() {
        assertEquals(NO_APPLICATION, computeStatus(new StudentActivity(1, 1, 0, 0, 0, 0, 0, 0, 0)));
    }

    @Test
    void signedContractWinsOverEverything() {
        assertEquals(CONTRACT_SIGNED, computeStatus(new StudentActivity(1, 1, 0, 3, 1, 1, 1, 1, 1)));
    }

}