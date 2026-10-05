package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CVAlreadyPublicException extends APIException {
    public CVAlreadyPublicException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
