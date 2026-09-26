package com.lacouf.rsbjwt.security.exception;

import org.springframework.http.HttpStatus;

public class InternshipNotFoundException extends APIException {
    public InternshipNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Internship not found with id: " + id);
    }
}
