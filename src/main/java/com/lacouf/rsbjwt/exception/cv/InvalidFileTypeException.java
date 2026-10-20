package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InvalidFileTypeException extends APIException {
    public InvalidFileTypeException() {
        super(HttpStatus.BAD_REQUEST, "Invalid file type. Only PDF files are allowed.");
    }
}
