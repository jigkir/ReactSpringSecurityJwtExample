package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class StudentConsentNotPendingException extends APIException {
    public StudentConsentNotPendingException(long applicationId) {
        super(HttpStatus.CONFLICT, "Application with id " + applicationId + ", student consents not pending");
    }
}
