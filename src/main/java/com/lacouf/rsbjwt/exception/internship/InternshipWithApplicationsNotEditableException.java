package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InternshipWithApplicationsNotEditableException extends APIException {
    public InternshipWithApplicationsNotEditableException(long internshipId) {
        super(HttpStatus.CONFLICT, "Internship with ID " + internshipId + " already has applications and can no longer be edited.");
    }
}