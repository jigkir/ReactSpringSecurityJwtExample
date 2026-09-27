package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CvAlreadyReviewedException extends APIException {
    public CvAlreadyReviewedException(long cvId) {
        super(HttpStatus.CONFLICT, "The CV with ID " + cvId + " has already been reviewed.");
    }
}
