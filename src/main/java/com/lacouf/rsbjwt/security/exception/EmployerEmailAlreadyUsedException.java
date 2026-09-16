package com.lacouf.rsbjwt.security.exception;

public class EmployerEmailAlreadyUsedException extends Exception {
    public EmployerEmailAlreadyUsedException() {
        super("Un employeur avec ce email existe déjà.");
    }
}
