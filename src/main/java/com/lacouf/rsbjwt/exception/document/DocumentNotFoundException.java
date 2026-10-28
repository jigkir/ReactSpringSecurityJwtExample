package com.lacouf.rsbjwt.exception.document;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class DocumentNotFoundException extends APIException {
    public DocumentNotFoundException(long id) {
        super(HttpStatus.NOT_FOUND, "Document not found with id: " + id);
    }
}
