package com.lacouf.rsbjwt.security.exception;

public class StudentAlreadyExistsException extends Exception {
    public StudentAlreadyExistsException() {
        super("student already exists");
    }
}
