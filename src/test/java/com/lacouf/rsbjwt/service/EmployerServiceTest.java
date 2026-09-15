package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Employer;
import com.lacouf.rsbjwt.repository.EmployerRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.EmployerEmailAlreadyUsedException;
import com.lacouf.rsbjwt.service.dto.EmployerRegistrationDto;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Employer> employerArgumentCaptor;

    private static EmployerRegistrationDto employerRegistrationDto;

    @BeforeAll
    static void createEmployerRegistrationDto() {
        employerRegistrationDto = new EmployerRegistrationDto("First Name", "Last Name", "email@example.com", "Test123@", "Company Name", "sector", "514-123-4567");
    }

    @Test
    void shouldSaveEmployer() throws EmployerEmailAlreadyUsedException {
        when(passwordEncoder.encode("Test123@")).thenReturn("Test123@-encoded");

        when(employerRepository.save(any(Employer.class)))
                .thenAnswer(answer((Employer employer) -> {
                    employer.setId(1L);
                    return employer;
                }));

        employerService.save(employerRegistrationDto);

        verify(employerRepository).save(employerArgumentCaptor.capture());

        Employer savedEmployer = employerArgumentCaptor.getValue();
        assertEquals("First Name", savedEmployer.getFirstName());
        assertEquals("Last Name", savedEmployer.getLastName());
        assertEquals("email@example.com", savedEmployer.getEmail());
        assertEquals("Test123@-encoded", savedEmployer.getPassword());
        assertEquals("Company Name", savedEmployer.getCompanyName());
        assertEquals("sector", savedEmployer.getActivitySector());
        assertEquals("514-123-4567", savedEmployer.getPhoneNumber());
    }

    @Test
    void shouldThrowExceptionWhenEmailAlreadyUsed() {
        when(employerRepository.existsByCredentialsEmail("email@example.com")).thenReturn(true);

        assertThrows(EmployerEmailAlreadyUsedException.class, () ->
                employerService.employerEmailAlreadyUsed("email@example.com")
        );

        verify(employerRepository, never()).save(any(Employer.class));
    }

}
