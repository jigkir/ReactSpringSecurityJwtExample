package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import org.springframework.http.HttpStatus;

public class PastSessionInternshipNotEditableException extends APIException {
    public PastSessionInternshipNotEditableException(AcademicSession internshipSession) {
        super(HttpStatus.CONFLICT, "Internships of the past " + internshipSession.getName() + " session can no longer be edited.");
    }
}