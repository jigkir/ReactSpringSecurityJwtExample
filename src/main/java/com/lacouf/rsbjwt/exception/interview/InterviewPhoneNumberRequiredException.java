package com.lacouf.rsbjwt.exception.interview;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InterviewPhoneNumberRequiredException extends APIException {
    public InterviewPhoneNumberRequiredException() {
        super(HttpStatus.BAD_REQUEST, "A phone number is required for a phone interview.");
    }
}
