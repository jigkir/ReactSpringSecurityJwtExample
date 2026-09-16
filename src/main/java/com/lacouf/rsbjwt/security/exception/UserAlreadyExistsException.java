package com.lacouf.rsbjwt.security.exception;

public class UserAlreadyExistsException extends Exception {
    public UserAlreadyExistsException() {
        super("user already exists");
    }
}
