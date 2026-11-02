package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationAlreadyHiredException extends APIException {
    public ApplicationAlreadyHiredException(long id) {
        super(HttpStatus.CONFLICT, "Application with ID " + id + " is already accepted.");
    }
}
