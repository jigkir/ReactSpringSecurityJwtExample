package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Teacher;
import com.lacouf.rsbjwt.model.UserApp;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.TeacherRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.TeacherAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.TeacherSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TeacherService {
    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;

    public TeacherService(TeacherRepository teacherRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository) {
        this.teacherRepository = teacherRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
    }

    public UserResponseDto save(TeacherSignUpDto teacherSignUpDto) throws TeacherAlreadyExistsException {
        VerifyIfTeacherExists(teacherSignUpDto);
        Credentials credentials = Credentials.builder()
                .email(teacherSignUpDto.email())
                .password(passwordEncoder.encode(teacherSignUpDto.password()))
                .role(Role.TEACHER)
                .build();

        Teacher teacher = new Teacher(
                teacherSignUpDto.firstName(),
                teacherSignUpDto.lastName(),
                credentials,
                teacherSignUpDto.discipline()
        );

        teacherRepository.save(teacher);

        return UserResponseDto.of(teacher);
    }

    private void VerifyIfTeacherExists(TeacherSignUpDto teacherSignUpDto) throws TeacherAlreadyExistsException {
        Optional<UserApp> teacherFoundByEmail = userAppRepository.findByCredentialsEmail(teacherSignUpDto.email());

        if (teacherFoundByEmail.isPresent()) {
            throw new TeacherAlreadyExistsException();
        }
    }

}
