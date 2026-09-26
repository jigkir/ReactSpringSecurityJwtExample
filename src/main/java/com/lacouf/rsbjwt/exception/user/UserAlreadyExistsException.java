package com.lacouf.rsbjwt.exception.user;

import com.lacouf.rsbjwt.exception.APIException;
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
