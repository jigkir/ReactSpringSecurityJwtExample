package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CVNotVisibleException extends APIException {
    public CVNotVisibleException() {
        super(HttpStatus.BAD_REQUEST, "CV is not visible for application");
    }
}
