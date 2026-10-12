package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class DeadlineAlreadyPassedException extends APIException {
    public DeadlineAlreadyPassedException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
