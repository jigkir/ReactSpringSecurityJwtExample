package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InternshipAlreadyReviewedException extends APIException {
    public InternshipAlreadyReviewedException(Long id) {
        super(HttpStatus.CONFLICT, "Internship with id: " + id + " was already reviewed.");
    }
}