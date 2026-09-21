package com.lacouf.rsbjwt.security.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new HashMap<>();

        BindingResult bindingResult = exception.getBindingResult();
        List<FieldError> fieldResult = bindingResult.getFieldErrors();

        fieldResult.forEach((error) -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });

        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyExistsException(UserAlreadyExistsException exception) {
        return new ResponseEntity<>(Map.of("message", exception.getMessage(), "field", exception.getField()), exception.getStatus());
    }

    @ExceptionHandler(APIException.class)
    public ResponseEntity<Map<String, String>> handleApiException(APIException exception) {
        return new ResponseEntity<>(Map.of("message", exception.getMessage()), exception.getStatus());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials() {
        return new ResponseEntity<>(Map.of("message", "Incorrect email or password"), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(InvalidFileTypeException.class)
    public ResponseEntity<Map<String, String>> handleInvalidFileTypeException(InvalidFileTypeException exception) {
        return new ResponseEntity<>(Map.of("message", exception.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(CorruptedFileException.class)
    public ResponseEntity<Map<String, String>> handleCorruptedFileException(CorruptedFileException exception) {
        return new ResponseEntity<>(Map.of("message", exception.getMessage()), HttpStatus.UNPROCESSABLE_CONTENT);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFoundException(UserNotFoundException exception) {
        return new ResponseEntity<>(Map.of("message", exception.getMessage()), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidFileSizeException.class)
    public ResponseEntity<Map<String, String>> handleInvalidFileSizeException(InvalidFileSizeException exception) {
        return new ResponseEntity<>(Map.of("message", exception.getMessage()), HttpStatus.CONTENT_TOO_LARGE);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException exception) {
        return new ResponseEntity<>(Map.of("message", "File is too large."), HttpStatus.PAYLOAD_TOO_LARGE);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, String>> handleMultipartException(MultipartException exception) {
        return new ResponseEntity<>(Map.of("message", "File is too large."), HttpStatus.PAYLOAD_TOO_LARGE);
    }

    @ExceptionHandler(CVAlreadyPublicException.class)
    public ResponseEntity<Map<String, String>> handleCVAlreadyPublicException(CVAlreadyPublicException exception) {
        return new ResponseEntity<>(Map.of("message", exception.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(CVAlredyPrivateException.class)
    public ResponseEntity<Map<String, String>> handleCVAlredyPrivateException(CVAlredyPrivateException exception) {
        return new ResponseEntity<>(Map.of("message", exception.getMessage()), HttpStatus.BAD_REQUEST);
    }
}
