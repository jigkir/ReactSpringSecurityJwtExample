package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Teacher;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.TeacherRepository;
import com.lacouf.rsbjwt.service.dto.TeacherRegistrationDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class TeacherService {
    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;

    public TeacherService(TeacherRepository teacherRepository, PasswordEncoder passwordEncoder) {
        this.teacherRepository = teacherRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponseDto save(TeacherRegistrationDto teacherRegistrationDto) {
        Credentials credentials = Credentials.builder()
                .email(teacherRegistrationDto.email())
                .password(passwordEncoder.encode(teacherRegistrationDto.password()))
                .role(Role.TEACHER)
                .build();

        Teacher teacher = new Teacher(
                teacherRegistrationDto.firstName(),
                teacherRegistrationDto.lastName(),
                credentials,
                teacherRegistrationDto.discipline()
        );

        teacherRepository.save(teacher);

        return UserResponseDto.of(teacher);
    }
}
