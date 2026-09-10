package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.StudentRepository;
import com.lacouf.rsbjwt.service.dto.StudentRegistrationDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class StudentService {
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponseDto save(StudentRegistrationDto studentRegistrationDto) {
        Credentials credentials = Credentials.builder()
                .email(studentRegistrationDto.email())
                .password(passwordEncoder.encode(studentRegistrationDto.password()))
                .role(Role.STUDENT)
                .build();

        Student student = new Student(
                studentRegistrationDto.firstName(),
                studentRegistrationDto.lastName(),
                studentRegistrationDto.studentId(),
                credentials,
                studentRegistrationDto.discipline()
        );

        studentRepository.save(student);

        return UserResponseDto.of(student);
    }
}
