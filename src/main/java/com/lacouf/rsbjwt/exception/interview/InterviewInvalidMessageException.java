package com.lacouf.rsbjwt.exception.interview;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InterviewInvalidMessageException extends APIException {
    public InterviewInvalidMessageException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
