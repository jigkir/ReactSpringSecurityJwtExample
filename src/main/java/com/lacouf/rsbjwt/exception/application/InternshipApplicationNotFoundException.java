package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InternshipApplicationNotFoundException extends APIException {
    public InternshipApplicationNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
