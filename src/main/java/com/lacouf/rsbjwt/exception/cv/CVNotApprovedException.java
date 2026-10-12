package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CVNotApprovedException extends APIException {
    public CVNotApprovedException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
