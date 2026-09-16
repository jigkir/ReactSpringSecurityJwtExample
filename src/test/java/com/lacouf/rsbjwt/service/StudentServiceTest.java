package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.repository.StudentRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.StudentSignUpDto;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.answer;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentServiceTest {

    @InjectMocks
    private StudentService studentService;

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Student> studentArgumentCaptor;

    private static StudentSignUpDto studentSignUpDto;

    @BeforeAll
    static void createStudentSignUpDto() {
        studentSignUpDto = new StudentSignUpDto("First Name", "Last Name", "1234567", "test@claurendeau.qc.ca", "Test123@", Discipline.COMPUTER_SCIENCE);
    }

    @Test
    void shouldSaveStudent() throws UserAlreadyExistsException {
        // Arrange
        when(passwordEncoder.encode("Test123@")).thenReturn("Test123@-encoded");

        when(studentRepository.save(any(Student.class)))
                .thenAnswer(answer((Student student) -> {
                    student.setId(1L);
                    return student;
                }));

        // Act
        studentService.save(studentSignUpDto);

        // Assert
        verify(studentRepository).save(studentArgumentCaptor.capture());

        Student student = studentArgumentCaptor.getValue();

        assert(student.getFirstName()).equals("First Name");
        assert(student.getLastName()).equals("Last Name");
        assert(student.getStudentId()).equals("1234567");
        assert(student.getEmail()).equals("test@claurendeau.qc.ca");
        assert(student.getPassword()).equals("Test123@-encoded");
        assert(student.getDiscipline()).equals(Discipline.COMPUTER_SCIENCE);
    }

    @Test
    void shouldThrowUserAlreadyExistsExceptionWhenStudentIdAlreadyExists() {
        // Arrange
        when(studentRepository.findByStudentId(studentSignUpDto.studentId())).thenReturn(Optional.of(new Student()));

        // Act + Assert
        assertThrows(UserAlreadyExistsException.class, () -> studentService.save(studentSignUpDto));

        verify(studentRepository, never()).save(any(Student.class));
    }
}
