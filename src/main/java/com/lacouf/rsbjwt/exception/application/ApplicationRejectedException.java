package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationRejectedException extends APIException {
    public ApplicationRejectedException(long id) {
        super(HttpStatus.CONFLICT, "Application with ID " + id + " has been rejected.");
    }
}
