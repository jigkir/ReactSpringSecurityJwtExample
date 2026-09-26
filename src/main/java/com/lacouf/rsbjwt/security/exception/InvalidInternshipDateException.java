package com.lacouf.rsbjwt.security.exception;

import org.springframework.http.HttpStatus;

public class InvalidInternshipDateException extends APIException {
    public InvalidInternshipDateException(String dateType) {
        super(HttpStatus.BAD_REQUEST, "Invalid " + dateType + ". Should be in the future.");
    }
}
