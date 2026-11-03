package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ContractAlreadyActiveException extends APIException {
    public ContractAlreadyActiveException(long contractId) {
        super(HttpStatus.CONFLICT, "Contract with ID " + contractId + " is already active");
    }
}
