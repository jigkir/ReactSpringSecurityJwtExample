package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationAlreadyRejectedException extends APIException {
    public ApplicationAlreadyRejectedException(long applicationId) {
        super(HttpStatus.CONFLICT, "Application " + applicationId + " is already rejected.");
    }
}
