package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class ContractNotSignedByStudentAndEmployerException extends APIException {
    public ContractNotSignedByStudentAndEmployerException(long contractId) {
        super(HttpStatus.CONFLICT, "Contract " + contractId + " must be signed by the student and the employer before the manager signs it.");
    }
}
