package com.lacouf.rsbjwt.exception.cv;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class CVNotApprovedException extends APIException {
    public CVNotApprovedException() {
        super(HttpStatus.BAD_REQUEST, "CV is not approved for application");
    }
}
