package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ContractAlreadyExistsException extends APIException {
    public ContractAlreadyExistsException(long internshipApplicationId) {
        super(HttpStatus.CONFLICT, "Contract for internship application with ID " + internshipApplicationId + " already exists.");
    }
}
