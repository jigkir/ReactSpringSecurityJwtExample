package com.lacouf.rsbjwt.presentation.Exceptions;

import jakarta.persistence.ElementCollection;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleException(Exception e) {
        return ResponseEntity.status(400).body(e.getMessage());
    }

}
