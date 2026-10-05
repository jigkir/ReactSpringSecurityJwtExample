package com.lacouf.rsbjwt.exception;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
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

    private static final String MESSAGE_KEY = "message";
    private static final String FIELD_KEY = "field";
    private static final String FILE_TOO_LARGE = "File is too large.";
    private static final String BAD_CREDENTIALS = "Incorrect email or password";

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
        return new ResponseEntity<>(
                Map.of(MESSAGE_KEY, exception.getMessage(), FIELD_KEY, exception.getField()),
                exception.getStatus());
    }

    @ExceptionHandler(APIException.class)
    public ResponseEntity<Map<String, String>> handleApiException(APIException exception) {
        return new ResponseEntity<>(Map.of(MESSAGE_KEY, exception.getMessage()), exception.getStatus());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials() {
        return new ResponseEntity<>(Map.of(MESSAGE_KEY, BAD_CREDENTIALS), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler({MaxUploadSizeExceededException.class, MultipartException.class})
    public ResponseEntity<Map<String, String>> handleFileTooLarge() {
        return new ResponseEntity<>(Map.of(MESSAGE_KEY, FILE_TOO_LARGE), HttpStatus.CONTENT_TOO_LARGE);
    }
}
