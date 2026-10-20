package com.lacouf.rsbjwt.exception.interview;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InterviewAlreadyExistsException extends APIException {
    public InterviewAlreadyExistsException(long id) {
        super(HttpStatus.CONFLICT, "Interview already exists for internship application with ID: " + id);
    }
}
