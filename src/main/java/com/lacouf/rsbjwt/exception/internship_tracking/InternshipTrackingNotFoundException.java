package com.lacouf.rsbjwt.exception.internship_tracking;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InternshipTrackingNotFoundException extends APIException {
    public InternshipTrackingNotFoundException(long id) {
        super(HttpStatus.NOT_FOUND, "Internship Tracking not found with id: " + id);
    }
}
