package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ContractNotFoundException extends APIException {
    public ContractNotFoundException(long contractId) {
        super(HttpStatus.NOT_FOUND, "Contract not found with id: " + contractId);
    }
}
