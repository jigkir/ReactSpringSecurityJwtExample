package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.model.UserApp;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.StudentRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

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

    public UserResponseDto save(StudentSignUpDto studentSignUpDto) throws UserAlreadyExistsException {
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

    private void verifyIfStudentExists(String email, String studentId) throws UserAlreadyExistsException {
        Optional<UserApp> studentFoundByEmail = userAppRepository.findByCredentialsEmail(email);
        Optional<Student> studentFoundByStudentId = studentRepository.findByStudentId(studentId);

        if (studentFoundByEmail.isPresent()) {
            throw new UserAlreadyExistsException("email");
        }

        if (studentFoundByStudentId.isPresent()) {
            throw new UserAlreadyExistsException("studentId");
        }
    }

    public Student findByStudentId(String studentId) {
        return studentRepository.findByStudentId(studentId)
                .orElseThrow(UserNotFoundException::new);
    }
}
