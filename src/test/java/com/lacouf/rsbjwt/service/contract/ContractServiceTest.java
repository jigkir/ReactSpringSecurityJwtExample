package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.exception.contract.ApplicationNotOfferedException;
import com.lacouf.rsbjwt.exception.contract.ApplicationRejectedException;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadyExistsException;
import com.lacouf.rsbjwt.exception.contract.StudentAlreadyEmployedException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.StudentInternshipStatus;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ContractServiceTest {

    @InjectMocks
    private ContractService contractService;

    @Mock
    private ContractRepository contractRepository;

    @Captor
    private ArgumentCaptor<Contract> contractArgumentCaptor;

    private static final long APPLICATION_ID = 20L;
    private static final String STUDENT_EMAIL = "student@example.com";
    private static final String EMPLOYER_EMAIL = "email@example.com";

    private Employer employer;
    private Internship internship;
    private Student student;

    @BeforeEach
    void setUp() {
        Credentials employerCredentials = Credentials.builder()
                .email(EMPLOYER_EMAIL)
                .password("Test123@-encoded")
                .role(Role.EMPLOYER)
                .build();

        employer = new Employer("First Name", "Last Name", employerCredentials, "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");
        employer.setId(1L);

        AcademicSession session = new AcademicSession(Season.WINTER, 2027);
        session.setId(1L);

        internship = new Internship("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID,
                LocalDate.now().plusMonths(4), LocalDate.now().plusMonths(2), new BigDecimal("25.00"), false, employer, session);
        internship.setId(10L);

        Credentials studentCredentials = Credentials.builder()
                .email(STUDENT_EMAIL)
                .password("Test123@-encoded")
                .role(Role.STUDENT)
                .build();

        student = new Student("Jane", "Doe", "1234567", studentCredentials, Discipline.COMPUTER_SCIENCE, null);
        student.setId(3L);
        student.setStudentInternshipStatus(StudentInternshipStatus.NOT_EMPLOYED);
    }

    // ==========================================
    // Contract Creation Tests
    // ==========================================

    @Test
    void shouldCreateContractWhenApplicationWasOffered() throws Exception {
        // Arrange
        InternshipApplication application = offeredApplication();

        // Act
        contractService.createContract(application);

        // Assert
        verify(contractRepository).save(contractArgumentCaptor.capture());

        Contract savedContract = contractArgumentCaptor.getValue();

        assert application.equals(savedContract.getInternshipApplication());
    }

    @Test
    void shouldCopyStudentAndEmployerFromApplicationWhenCreatingContract() throws Exception {
        // Arrange
        InternshipApplication application = offeredApplication();

        // Act
        contractService.createContract(application);

        // Assert
        verify(contractRepository).save(contractArgumentCaptor.capture());

        Contract savedContract = contractArgumentCaptor.getValue();

        assert student.equals(savedContract.getStudent());
        assert employer.equals(savedContract.getEmployer());
    }

    @Test
    void shouldReturnSavedContractWhenCreatingContract() throws Exception {
        // Arrange
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Contract contract = contractService.createContract(offeredApplication());

        // Assert
        assert contract != null;
        assert student.equals(contract.getStudent());
    }

    // ==========================================
    // Contract Creation Validation Tests
    // ==========================================

    @Test
    void shouldThrowContractAlreadyExistsExceptionWhenContractAlreadyExistsForApplication() {
        // Arrange
        when(contractRepository.existsByInternshipApplicationId(APPLICATION_ID)).thenReturn(true);

        // Act + Assert
        assertThrows(ContractAlreadyExistsException.class, () -> contractService.createContract(offeredApplication()));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldThrowApplicationRejectedExceptionWhenApplicationWasRejected() {
        // Arrange
        InternshipApplication application = applicationWithDecision(EmployerDecision.REJECTED);

        // Act + Assert
        assertThrows(ApplicationRejectedException.class, () -> contractService.createContract(application));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldThrowApplicationNotOfferedExceptionWhenApplicationWasNeverOffered() {
        // Arrange
        InternshipApplication application = application();

        // Act + Assert
        assertThrows(ApplicationNotOfferedException.class, () -> contractService.createContract(application));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldThrowStudentAlreadyEmployedExceptionWhenStudentIsAlreadyEmployed() {
        // Arrange
        student.setStudentInternshipStatus(StudentInternshipStatus.EMPLOYED);

        // Act + Assert
        assertThrows(StudentAlreadyEmployedException.class, () -> contractService.createContract(offeredApplication()));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldThrowContractAlreadyExistsExceptionBeforeCheckingApplicationDecision() {
        // Arrange
        when(contractRepository.existsByInternshipApplicationId(APPLICATION_ID)).thenReturn(true);

        InternshipApplication application = applicationWithDecision(EmployerDecision.REJECTED);

        // Act + Assert
        assertThrows(ContractAlreadyExistsException.class, () -> contractService.createContract(application));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    // ---------- Helpers ----------

    private InternshipApplication application() {
        CV cv = new CV();
        cv.setId(5L);
        cv.setFileName("cv.pdf");

        InternshipApplication application = new InternshipApplication(internship, cv, student);
        application.setId(APPLICATION_ID);

        return application;
    }

    private InternshipApplication applicationWithDecision(EmployerDecision decision) {
        InternshipApplication application = application();
        application.updateEmployerDecision(decision);
        return application;
    }

    private InternshipApplication offeredApplication() {
        return applicationWithDecision(EmployerDecision.INTERNSHIP_OFFERED);
    }
}