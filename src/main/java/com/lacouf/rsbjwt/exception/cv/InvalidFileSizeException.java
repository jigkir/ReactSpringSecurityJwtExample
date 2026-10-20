package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InvalidFileSizeException extends APIException {
    public InvalidFileSizeException(int maxFileSize) {
        super(HttpStatus.CONTENT_TOO_LARGE, "File size exceeds the maximum allowed size of " + maxFileSize + " bytes.");
    }
}
