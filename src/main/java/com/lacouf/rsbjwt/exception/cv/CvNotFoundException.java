package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CvNotFoundException extends APIException {
    public CvNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
