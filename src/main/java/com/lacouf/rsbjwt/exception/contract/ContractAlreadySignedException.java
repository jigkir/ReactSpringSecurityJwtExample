package com.lacouf.rsbjwt.exception.contract;

import com.lacouf.rsbjwt.exception.APIException;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import org.springframework.http.HttpStatus;

public class ContractAlreadySignedException extends APIException {
    public ContractAlreadySignedException(long contractId, ContractParty party) {
        String partyName = party.name();

        super(HttpStatus.CONFLICT, "Contract " + contractId + " is already signed by the " + partyName.toLowerCase() + ".");
    }
}
