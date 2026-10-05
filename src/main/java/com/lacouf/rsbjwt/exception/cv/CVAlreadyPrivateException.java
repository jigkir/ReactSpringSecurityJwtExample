package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CVAlreadyPrivateException extends APIException {
    public CVAlreadyPrivateException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
