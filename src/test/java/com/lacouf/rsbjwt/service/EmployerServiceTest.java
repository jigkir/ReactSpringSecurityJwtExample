package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.Employer;
import com.lacouf.rsbjwt.model.Internship;
import com.lacouf.rsbjwt.model.InternshipStatus;
import com.lacouf.rsbjwt.repository.EmployerRepository;
import com.lacouf.rsbjwt.repository.InternshipRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.InternshipResponseDto;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
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
    private InternshipRepository internshipRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Employer> employerArgumentCaptor;

    private static EmployerSignUpDto employerSignUpDto;
    private static InternshipRequestDto internshipRequestDto;
    private static Employer employer;
    private static Internship internship;

    @BeforeAll
    static void setUp() {
        employerSignUpDto = new EmployerSignUpDto("First Name", "Last Name", "email@example.com", "Test123@", "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");

        employer = new Employer("First Name", "Last Name", null, "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");
        employer.setId(1L);

        internshipRequestDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", "4 months", "Montreal", LocalDate.of(2027, 1, 10), LocalDate.of(2026, 12, 1), "25$/h", InternshipStatus.PENDING, false, 1L);

        internship = new Internship("Software Developer", "Develop applications", "Java Spring", "4 months", "Montreal", LocalDate.of(2027, 1, 10), LocalDate.of(2026, 12, 1), "25$/h", InternshipStatus.PENDING, false, employer);
        internship.setId(10L);
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

    @Test
    void shouldSaveInternship() throws UserNotFoundException {
        // Arrange
        when(employerRepository.findById(1L)).thenReturn(Optional.of(employer));

        when(internshipRepository.save(any(Internship.class)))
                .thenAnswer(invocation -> {
                    Internship internship = invocation.getArgument(0);
                    internship.setId(10L);
                    return internship;
                });

        // Act
        InternshipResponseDto response = employerService.save(internshipRequestDto);

        // Assert
        assert(Long.valueOf(10L)).equals(response.id());
        assert("Software Developer").equals(response.title());
        assert("Develop applications").equals(response.description());
        assert("Java, Spring").equals(response.requiredSkills());
        assert("4 months").equals(response.duration());
        assert("Montreal").equals(response.location());
        assert(LocalDate.of(2027, 1, 10)).equals(response.startDate());
        assert(LocalDate.of(2026, 12, 1)).equals(response.deadline());
        assert("25$/h").equals(response.compensation());
        assert(InternshipStatus.PENDING).equals(response.status());
        assert(Boolean.FALSE).equals(response.isDeleted());
        assert(Long.valueOf(1L)).equals(response.employerId());

        verify(internshipRepository).save(any(Internship.class));
    }

    @Test
    void shouldSoftDeleteInternship() {
        // Arrange
        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));

        // Act
        InternshipResponseDto response = employerService.deleteInternship(10L);

        // Assert
        assert(Boolean.TRUE).equals(internship.getIsDeleted());
        assert(Boolean.TRUE).equals(response.isDeleted());
        assert(Long.valueOf(10L)).equals(response.id());

        verify(internshipRepository).save(internship);
    }
}
