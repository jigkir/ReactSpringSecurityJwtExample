package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InvalidFileSizeException extends APIException {
    public InvalidFileSizeException(String message) {
        super(HttpStatus.CONTENT_TOO_LARGE, message);
    }
}
