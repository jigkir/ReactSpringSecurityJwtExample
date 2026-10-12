package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CvNotFoundException extends APIException {
    public CvNotFoundException(long id) {
        super(HttpStatus.NOT_FOUND, "CV not found with id: " + id);
    }
}
