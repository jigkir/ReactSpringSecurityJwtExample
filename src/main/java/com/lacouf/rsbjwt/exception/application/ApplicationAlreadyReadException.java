package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationAlreadyReadException extends APIException {
    public ApplicationAlreadyReadException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
