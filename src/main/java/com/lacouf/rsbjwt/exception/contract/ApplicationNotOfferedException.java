package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationNotOfferedException extends APIException {
    public ApplicationNotOfferedException(long id) {
        super(HttpStatus.CONFLICT, "Application with ID " + id + " has no internship offer.");
    }
}