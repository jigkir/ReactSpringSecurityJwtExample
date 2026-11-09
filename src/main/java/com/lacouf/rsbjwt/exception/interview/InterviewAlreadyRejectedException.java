package com.lacouf.rsbjwt.exception.interview;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InterviewAlreadyRejectedException extends APIException {
    public InterviewAlreadyRejectedException(long interviewId) {
        super(HttpStatus.CONFLICT, "Interview with id " + interviewId + " is already rejected");
    }
}
