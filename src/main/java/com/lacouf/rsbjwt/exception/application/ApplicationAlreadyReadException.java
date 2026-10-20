package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationAlreadyReadException extends APIException {
    public ApplicationAlreadyReadException() {
        super(HttpStatus.CONFLICT, "Cannot update an application that has already been read");
    }
}
