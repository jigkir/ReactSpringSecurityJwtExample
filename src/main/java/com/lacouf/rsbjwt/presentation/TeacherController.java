package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.security.exception.TeacherAlreadyExistsException;
import com.lacouf.rsbjwt.service.TeacherService;
import com.lacouf.rsbjwt.service.dto.TeacherSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {
    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService){this.teacherService = teacherService;}

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> save(@Valid @RequestBody TeacherSignUpDto teacherSignUpDto) throws TeacherAlreadyExistsException {
        UserResponseDto signedUpTeacher = teacherService.save(teacherSignUpDto);

        return new ResponseEntity<>(signedUpTeacher, HttpStatus.CREATED);
    }

}
