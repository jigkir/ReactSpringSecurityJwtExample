package com.lacouf.rsbjwt.security.exception;

import org.springframework.http.HttpStatus;

public class UserAlreadyExistsException extends APIException {
    private final String field;

    public UserAlreadyExistsException(String field) {
        super(HttpStatus.CONFLICT, "user already exists");
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
