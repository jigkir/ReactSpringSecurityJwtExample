package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.Teacher;
import com.lacouf.rsbjwt.repository.TeacherRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.TeacherSignUpDto;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
public class TeacherServiceTest {
    @InjectMocks
    private TeacherService teacherService;

    @Mock
    private TeacherRepository teacherRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Teacher> teacherArgumentCaptor;

    private static TeacherSignUpDto teacherSignUpDto;

    @BeforeAll
    static void createTeacherSignUpDto() {
        teacherSignUpDto = new TeacherSignUpDto("First Name", "Last Name", "1234567", "test@claurendeau.qc.ca", "Test123@", Discipline.COMPUTER_SCIENCE);
    }

    @Test
    void shouldSaveTeacher() throws UserAlreadyExistsException {
        // Arrange
        when(passwordEncoder.encode("Test123@")).thenReturn("Test123@-encoded");

        when(teacherRepository.save(any(Teacher.class)))
                .thenAnswer(answer((Teacher teacher) -> {
                    teacher.setId(1L);
                    return teacher;
                }));

        // Act
        teacherService.save(teacherSignUpDto);

        // Assert
        verify(teacherRepository).save(teacherArgumentCaptor.capture());

        Teacher teacher = teacherArgumentCaptor.getValue();

        assert(teacher.getFirstName()).equals("First Name");
        assert(teacher.getLastName()).equals("Last Name");
        assert(teacher.getTeacherId()).equals("1234567");
        assert(teacher.getEmail()).equals("test@claurendeau.qc.ca");
        assert(teacher.getPassword()).equals("Test123@-encoded");
        assert(teacher.getDiscipline()).equals(Discipline.COMPUTER_SCIENCE);
    }

    @Test
    void shouldThrowUserAlreadyExistsExceptionWhenTeacherIdAlreadyExists() {
        // Arrange
        when(teacherRepository.findByTeacherId(teacherSignUpDto.teacherId())).thenReturn(Optional.of(new Teacher()));

        // Act + Assert
        assertThrows(UserAlreadyExistsException.class, () -> teacherService.save(teacherSignUpDto));

        verify(teacherRepository, never()).save(any(Teacher.class));
    }

    @Test
    void shouldThrowUserAlreadyExistsExceptionWhenEmailAlreadyExists() {
        // Arrange
        when(userAppRepository.findByCredentialsEmail(teacherSignUpDto.email())).thenReturn(Optional.of(new Teacher()));

        // Act + Assert
        assertThrows(UserAlreadyExistsException.class, () -> teacherService.save(teacherSignUpDto));

        verify(teacherRepository, never()).save(any(Teacher.class));
    }
}
