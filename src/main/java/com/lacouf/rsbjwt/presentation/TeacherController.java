package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.service.TeacherService;
import com.lacouf.rsbjwt.service.dto.TeacherRegistrationDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/professeur")
public class TeacherController {
    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService){this.teacherService = teacherService;}

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> save(@Valid @RequestBody TeacherRegistrationDto teacherRegistrationDto) {
        UserResponseDto registeredTeacher = teacherService.save(teacherRegistrationDto);

        return new ResponseEntity<>(registeredTeacher, HttpStatus.CREATED);
    }

}
