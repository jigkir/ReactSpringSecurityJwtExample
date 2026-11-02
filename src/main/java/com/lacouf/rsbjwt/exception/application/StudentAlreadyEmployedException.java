package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class StudentAlreadyEmployedException extends APIException {
    public StudentAlreadyEmployedException(long studentId) {
        super(HttpStatus.CONFLICT, "Student with ID " + studentId + " is already employed");
    }
}
