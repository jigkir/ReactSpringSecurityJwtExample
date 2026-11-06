package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationAlreadyAcceptedException extends APIException {
    public ApplicationAlreadyAcceptedException(long applicationId) {
        super(HttpStatus.CONFLICT, "Application with ID " + applicationId + " is already accepted");
    }
}
