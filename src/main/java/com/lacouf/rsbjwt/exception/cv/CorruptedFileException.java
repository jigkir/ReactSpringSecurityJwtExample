package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CorruptedFileException extends APIException {
    public CorruptedFileException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "The PDF file is corrupted or unreadable.");
    }
}
