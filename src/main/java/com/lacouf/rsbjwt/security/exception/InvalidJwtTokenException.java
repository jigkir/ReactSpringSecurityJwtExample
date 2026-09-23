package com.lacouf.rsbjwt.security.exception;

import org.springframework.http.HttpStatus;

public class InvalidJwtTokenException extends APIException {
  public InvalidJwtTokenException(String message) {
    super(HttpStatus.UNAUTHORIZED, message);
  }
}
