package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.model.UserApp;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.StudentRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.StudentAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class StudentService {
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;


    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
    }

    public UserResponseDto save(StudentSignUpDto studentSignUpDto) throws StudentAlreadyExistsException {
        verifyIfStudentExists(studentSignUpDto.email(), studentSignUpDto.studentId());

        Credentials credentials = Credentials.builder()
                .email(studentSignUpDto.email())
                .password(passwordEncoder.encode(studentSignUpDto.password()))
                .role(Role.STUDENT)
                .build();

        Student student = new Student(
                studentSignUpDto.firstName(),
                studentSignUpDto.lastName(),
                studentSignUpDto.studentId(),
                credentials,
                studentSignUpDto.discipline()
        );

        studentRepository.save(student);

        return UserResponseDto.of(student);
    }

    private void verifyIfStudentExists(String email, String studentId) throws StudentAlreadyExistsException {
        UserApp studentFoundByEmail = userAppRepository.findByCredentialsEmail(email);
        Student studentFoundByStudentId = studentRepository.findByStudentId(studentId);

        if (studentFoundByEmail != null || studentFoundByStudentId != null) {
            throw new StudentAlreadyExistsException();
        }
    }
}
