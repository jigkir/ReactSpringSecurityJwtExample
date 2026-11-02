package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ContractNotPendingException extends APIException {
    public ContractNotPendingException(long contractId) {
        super(HttpStatus.CONFLICT, "Contract with ID " + contractId + " is not pending.");
    }
}
