package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.security.exception.StudentAlreadyExistsException;
import com.lacouf.rsbjwt.service.StudentService;
import com.lacouf.rsbjwt.service.dto.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/student")
public class StudentController {
    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> save(@Valid @RequestBody StudentSignUpDto studentSignUpDto) throws StudentAlreadyExistsException {
        UserResponseDto signedUpStudent = studentService.save(studentSignUpDto);

        return new ResponseEntity<>(signedUpStudent, HttpStatus.CREATED);
    }
}
