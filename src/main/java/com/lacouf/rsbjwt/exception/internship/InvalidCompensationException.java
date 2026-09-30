package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InvalidCompensationException extends APIException {
    public InvalidCompensationException() {
        super(HttpStatus.BAD_REQUEST, "A compensation amount is required unless it is negotiable.");
    }
}
