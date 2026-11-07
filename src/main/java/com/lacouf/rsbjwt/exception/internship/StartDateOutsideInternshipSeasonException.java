package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class StartDateOutsideInternshipSeasonException extends APIException {
    public StartDateOutsideInternshipSeasonException() {
        super(HttpStatus.BAD_REQUEST, "Invalid start date. Internships start in a winter session, between January 1 and May 31.");
    }
}
