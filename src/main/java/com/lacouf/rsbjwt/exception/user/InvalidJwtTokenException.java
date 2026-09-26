package com.lacouf.rsbjwt.exception.user;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class InvalidJwtTokenException extends APIException {
  public InvalidJwtTokenException(String message) {
    super(HttpStatus.UNAUTHORIZED, message);
  }
}
