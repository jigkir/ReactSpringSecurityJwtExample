package com.lacouf.rsbjwt.service.contract;

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
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
    private static final long CONTRACT_ID = 40L;
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

        AcademicSession session = new AcademicSession(Season.FALL, 2026);
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

    // ---------- createContract ----------

    @Test
    void shouldCreateContract() throws Exception {
        // Arrange
        InternshipApplication application = application();

        // Act
        contractService.createContract(application);

        // Assert
        verify(contractRepository).save(contractArgumentCaptor.capture());

        Contract savedContract = contractArgumentCaptor.getValue();
        assertEquals(application, savedContract.getInternshipApplication());
    }

    @Test
    void shouldThrowWhenContractAlreadyExistsForApplication() {
        // Arrange
        when(contractRepository.existsByInternshipApplicationId(APPLICATION_ID)).thenReturn(true);

        // Act + Assert
        assertThrows(ContractAlreadyExistsException.class, () -> contractService.createContract(application()));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldThrowWhenCreatingContractForRejectedApplication() {
        // Arrange
        InternshipApplication application = application();
        application.updateEmployerDecision(EmployerDecision.REJECTED);

        // Act + Assert
        assertThrows(ApplicationRejectedException.class, () -> contractService.createContract(application));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldThrowWhenCreatingContractForStudentAlreadyEmployed() {
        // Arrange
        student.setStudentInternshipStatus(StudentInternshipStatus.EMPLOYED);

        // Act + Assert
        assertThrows(StudentAlreadyEmployedException.class, () -> contractService.createContract(application()));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    // ---------- Helpers ----------

    private InternshipApplication application() {
        CV cv = new CV();
        cv.setId(5L);
        cv.setFileName("cv.pdf");

        InternshipApplication application = new InternshipApplication(internship, cv, student);
        application.setId(ContractServiceTest.APPLICATION_ID);

        return application;
    }
}