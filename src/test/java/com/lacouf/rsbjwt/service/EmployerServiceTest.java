package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.Employer;
import com.lacouf.rsbjwt.repository.EmployerRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.EmployerSignUpDto;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.AdditionalAnswers.answer;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployerServiceTest {

    @InjectMocks
    private EmployerService employerService;

    @Mock
    private EmployerRepository employerRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Employer> employerArgumentCaptor;

    private static EmployerSignUpDto employerSignUpDto;

    @BeforeAll
    static void createEmployerSignUpDto() {
        employerSignUpDto = new EmployerSignUpDto("First Name", "Last Name", "email@example.com", "Test123@", "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");
    }

    @Test
    void shouldSaveEmployer() throws UserAlreadyExistsException {
        // Arrange
        when(passwordEncoder.encode("Test123@")).thenReturn("Test123@-encoded");

        when(employerRepository.save(any(Employer.class)))
                .thenAnswer(answer((Employer employer) -> {
                    employer.setId(1L);
                    return employer;
                }));

        // Act
        employerService.save(employerSignUpDto);

        // Assert
        verify(employerRepository).save(employerArgumentCaptor.capture());

        Employer savedEmployer = employerArgumentCaptor.getValue();
        assert(savedEmployer.getFirstName()).equals("First Name");
        assert(savedEmployer.getLastName()).equals("Last Name");
        assert(savedEmployer.getEmail()).equals("email@example.com");
        assert(savedEmployer.getPassword()).equals("Test123@-encoded");
        assert(savedEmployer.getCompanyName()).equals("Company Name");
        assert(savedEmployer.getDiscipline()).equals(Discipline.COMPUTER_SCIENCE);
        assert(savedEmployer.getPhoneNumber()).equals("514-123-4567");
    }

    @Test
    void shouldThrowUserAlreadyExistsWhenEmailAlreadyUsed() {
        // Arrange
        when(userAppRepository.findByCredentialsEmail(employerSignUpDto.email())).thenReturn(Optional.of(new Employer()));

        // Act
        UserAlreadyExistsException exception = assertThrows(
                UserAlreadyExistsException.class,
                () -> employerService.save(employerSignUpDto)
        );

        // Assert
        assert("email").equals(exception.getField());
        assert("user already exists").equals(exception.getMessage());

        verify(employerRepository, never()).save(any(Employer.class));
    }

}
