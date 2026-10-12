package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationAlreadyExistsException extends APIException {
    public ApplicationAlreadyExistsException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
