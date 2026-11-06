package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InternshipAlreadyOfferedException extends APIException {
    public InternshipAlreadyOfferedException(long id) {
        super(HttpStatus.CONFLICT, "Application with ID " + id + " is already accepted.");
    }
}
