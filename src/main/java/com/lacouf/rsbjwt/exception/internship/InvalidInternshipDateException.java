package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InvalidInternshipDateException extends APIException {
    public InvalidInternshipDateException(String dateType) {
        super(HttpStatus.BAD_REQUEST, "Invalid " + dateType + ". Should be in the future.");
    }
}
