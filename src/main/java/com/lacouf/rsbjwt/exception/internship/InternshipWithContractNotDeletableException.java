package com.lacouf.rsbjwt.exception.internship;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InternshipWithContractNotDeletableException extends APIException {
    public InternshipWithContractNotDeletableException(long internshipId) {
        super(HttpStatus.CONFLICT, "Internship with ID " + internshipId + " has a contract and can no longer be deleted.");
    }
}