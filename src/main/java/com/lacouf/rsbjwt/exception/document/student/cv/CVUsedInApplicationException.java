package com.lacouf.rsbjwt.exception.document.student.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CVUsedInApplicationException extends APIException {
    public CVUsedInApplicationException(long cvId) {
        super(HttpStatus.CONFLICT, "CV " + cvId + " is used in an internship application and can no longer be rejected.");
    }
}