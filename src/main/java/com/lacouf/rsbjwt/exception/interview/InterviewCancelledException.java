package com.lacouf.rsbjwt.exception.interview;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InterviewCancelledException extends APIException {
    public InterviewCancelledException(long interviewId) {
        super(HttpStatus.CONFLICT, "Interview with ID " + interviewId + " has been cancelled.");
    }
}
