package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class EmptyFileException extends APIException {
    public EmptyFileException() {
        super(HttpStatus.BAD_REQUEST, "File content cannot be null or empty.");
    }
}
