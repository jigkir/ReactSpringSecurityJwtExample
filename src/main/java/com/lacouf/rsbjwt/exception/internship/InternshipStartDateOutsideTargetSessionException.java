package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import org.springframework.http.HttpStatus;

public class InternshipStartDateOutsideTargetSessionException extends APIException {
    public InternshipStartDateOutsideTargetSessionException(AcademicSession targetSession) {
        super(HttpStatus.BAD_REQUEST, "Invalid start date. Internships can only start during the " + targetSession.getName()
                + " session, between " + targetSession.getStartDate() + " and " + targetSession.getEndDate() + ".");
    }
}
