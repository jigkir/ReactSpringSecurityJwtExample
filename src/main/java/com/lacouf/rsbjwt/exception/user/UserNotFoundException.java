package com.lacouf.rsbjwt.exception.user;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class UserNotFoundException extends APIException {
        public UserNotFoundException() {
            super(HttpStatus.NOT_FOUND,"userNotFound");

        }
}
