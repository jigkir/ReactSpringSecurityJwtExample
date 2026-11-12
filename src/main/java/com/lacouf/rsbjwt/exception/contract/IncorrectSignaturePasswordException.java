package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class IncorrectSignaturePasswordException extends APIException {
    public IncorrectSignaturePasswordException() {
        super(HttpStatus.BAD_REQUEST, "The signature password is incorrect.");
    }
}
