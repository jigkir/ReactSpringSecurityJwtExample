package com.lacouf.rsbjwt.exception.application;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ApplicationDocumentNotFoundException extends APIException {
    public ApplicationDocumentNotFoundException(long applicationId) {
        super(HttpStatus.NOT_FOUND, "Document not attached to internship application with id: " + applicationId);
    }
}
