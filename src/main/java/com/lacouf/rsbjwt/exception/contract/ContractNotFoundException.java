package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ContractNotFoundException extends APIException {
    public ContractNotFoundException(long id) {
        super(HttpStatus.NOT_FOUND, "Contract with ID " + id + " not found.");
    }
}
