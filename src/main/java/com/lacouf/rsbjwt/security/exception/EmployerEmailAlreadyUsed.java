package com.lacouf.rsbjwt.security.exception;

public class EmployerEmailAlreadyUsed extends RuntimeException {
    public EmployerEmailAlreadyUsed() {
        super("Un employeur avec ce email existe déjà.");
    }
}
