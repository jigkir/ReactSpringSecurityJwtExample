package com.lacouf.rsbjwt.exception.interview;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InterviewAlreadyPassedException extends APIException {
    public InterviewAlreadyPassedException(long id) {
        super(HttpStatus.BAD_REQUEST, "Interview with ID " + id + " has a date in the past.");
    }
}
