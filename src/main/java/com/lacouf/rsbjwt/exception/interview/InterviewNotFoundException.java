package com.lacouf.rsbjwt.exception.interview;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InterviewNotFoundException extends APIException {
    public InterviewNotFoundException(long id) {
        super(HttpStatus.NOT_FOUND, "Interview with ID " + id + " not found.");
    }
}
