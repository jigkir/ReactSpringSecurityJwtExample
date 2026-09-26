package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.Employer;
import com.lacouf.rsbjwt.model.Internship;
import com.lacouf.rsbjwt.model.InternshipStatus;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.EmployerRepository;
import com.lacouf.rsbjwt.repository.InternshipRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.InternshipNotFoundException;
import com.lacouf.rsbjwt.security.exception.InvalidInternshipDateException;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
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
    @Captor
    private ArgumentCaptor<Internship> internshipArgumentCaptor;

    private static EmployerSignUpDto employerSignUpDto;
    private static InternshipRequestDto internshipRequestDto;

    private static Employer employer;
    private static Internship internship;

    private static final String EMPLOYER_EMAIL = "email@example.com";
    private static final LocalDate START_DATE = LocalDate.now().plusMonths(4);
    private static final LocalDate APPLICATION_DEADLINE = LocalDate.now().plusMonths(2);

    @BeforeAll
    static void setUp() {
        employerSignUpDto = new EmployerSignUpDto("First Name", "Last Name", EMPLOYER_EMAIL, "Test123@", "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");

        Credentials credentials = Credentials.builder()
                .email(EMPLOYER_EMAIL)
                .password("Test123@-encoded")
                .role(Role.EMPLOYER)
                .build();

        employer = new Employer("First Name", "Last Name", credentials, "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");
        employer.setId(1L);

        internshipRequestDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", Period.ofWeeks(16), "Montreal", START_DATE, APPLICATION_DEADLINE, new BigDecimal("25.00"), false);

        internship = new Internship("Software Developer", "Develop applications", "Java, Spring", Period.ofWeeks(16), "Montreal", START_DATE, APPLICATION_DEADLINE, new BigDecimal("25.00"), false, InternshipStatus.PENDING, employer);
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
        assert(savedEmployer.getEmail()).equals(EMPLOYER_EMAIL);
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
    void shouldSaveInternship() throws UserNotFoundException, InvalidInternshipDateException {
        // Arrange
        when(employerRepository.findByCredentialsEmail(EMPLOYER_EMAIL)).thenReturn(Optional.of(employer));

        when(internshipRepository.save(any(Internship.class)))
                .thenAnswer(invocation -> {
                    Internship internship = invocation.getArgument(0);
                    internship.setId(10L);
                    return internship;
                });

        // Act
        InternshipResponseDto response = employerService.saveInternship(internshipRequestDto, EMPLOYER_EMAIL);

        // Assert
        verify(internshipRepository).save(internshipArgumentCaptor.capture());

        Internship savedInternship = internshipArgumentCaptor.getValue();

        assert(InternshipStatus.PENDING).equals(savedInternship.getStatus());
        assert !savedInternship.isDeleted();
        assert(employer).equals(savedInternship.getPostedBy());

        assert(Long.valueOf(10L)).equals(response.id());
        assert("Software Developer").equals(response.title());
        assert("Develop applications").equals(response.description());
        assert("Java, Spring").equals(response.requiredSkills());
        assert(Period.ofWeeks(16)).equals(response.durationInWeeks());
        assert("Montreal").equals(response.location());
        assert(START_DATE).equals(response.startDate());
        assert(APPLICATION_DEADLINE).equals(response.applicationDeadline());
        assert(new BigDecimal("25.00")).equals(response.compensationAmount());
        assert !response.compensationNegotiable();
        assert(InternshipStatus.PENDING).equals(response.status());
        assert(Long.valueOf(1L)).equals(response.employerId());
    }

    @Test
    void shouldThrowInvalidInternshipDateWhenStartDateIsNotInFuture() {
        // Arrange
        InternshipRequestDto invalidDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", Period.ofWeeks(16), "Montreal", LocalDate.now(), APPLICATION_DEADLINE, new BigDecimal("25.00"), false);

        // Act
        InvalidInternshipDateException exception = assertThrows(InvalidInternshipDateException.class, () -> employerService.saveInternship(invalidDto, EMPLOYER_EMAIL));

        // Assert
        assert("Invalid start date. Should be in the future.").equals(exception.getMessage());

        verifyNoInteractions(employerRepository, internshipRepository);
    }

    @Test
    void shouldThrowInvalidInternshipDateWhenApplicationDeadlineIsNotInFuture() {
        // Arrange
        InternshipRequestDto invalidDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", Period.ofWeeks(16), "Montreal", START_DATE, LocalDate.now().minusDays(1), new BigDecimal("25.00"), false);

        // Act
        InvalidInternshipDateException exception = assertThrows(InvalidInternshipDateException.class, () -> employerService.saveInternship(invalidDto, EMPLOYER_EMAIL));

        // Assert
        assert("Invalid application deadline. Should be in the future.").equals(exception.getMessage());

        verifyNoInteractions(employerRepository, internshipRepository);
    }

    @Test
    void shouldSoftDeleteInternship() throws InternshipNotFoundException {
        // Arrange
        when(internshipRepository.findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(10L, EMPLOYER_EMAIL)).thenReturn(Optional.of(internship));

        // Act
        employerService.deleteInternship(10L, EMPLOYER_EMAIL);

        // Assert
        assert internship.isDeleted();

        verify(internshipRepository).save(internship);
    }

    @Test
    void shouldReturnInternshipsByEmployerId() {
        // Arrange
        when(internshipRepository.findByPostedBy_IdAndDeletedIsFalse(1L)).thenReturn(List.of(internship));

        // Act
        List<InternshipResponseDto> response = employerService.getInternshipsByEmployerId(1L);

        // Assert
        assert(Integer.valueOf(1)).equals(response.size());
        assert(Long.valueOf(10L)).equals(response.getFirst().id());
        assert("Software Developer").equals(response.getFirst().title());
        assert(Long.valueOf(1L)).equals(response.getFirst().employerId());
    }
}
