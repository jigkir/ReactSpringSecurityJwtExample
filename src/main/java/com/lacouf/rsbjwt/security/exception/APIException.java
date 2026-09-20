package com.lacouf.rsbjwt.security.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public abstract class APIException extends Exception{
	protected final HttpStatus status;

	public APIException(HttpStatus status, String message){
		super(message);
		this.status = status;
	}
}
