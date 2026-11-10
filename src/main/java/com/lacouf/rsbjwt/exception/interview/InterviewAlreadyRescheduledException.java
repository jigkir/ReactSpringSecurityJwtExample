package com.lacouf.rsbjwt.exception.interview;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InterviewAlreadyRescheduledException extends APIException {
    public InterviewAlreadyRescheduledException(long interviewId) {
        super(HttpStatus.CONFLICT, "Interview with id " + interviewId + " is already rescheduled at the same time");
    }
}
