package com.lacouf.rsbjwt.exception.session;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class AcademicSessionNotFoundException extends APIException {
    public AcademicSessionNotFoundException(long id) {
        super(HttpStatus.NOT_FOUND, "Academic session not found with id: " + id);
    }
}
