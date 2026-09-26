package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InternshipNotFoundException extends APIException {
    public InternshipNotFoundException(Long id) {
        super(HttpStatus.NOT_FOUND, "Internship not found with id: " + id);
    }
}
