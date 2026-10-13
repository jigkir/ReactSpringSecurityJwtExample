package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InternshipApplicationNotFoundException extends APIException {
    public InternshipApplicationNotFoundException(long id) {
        super(HttpStatus.NOT_FOUND, "Internship application not found with id: " + id);
    }
}
