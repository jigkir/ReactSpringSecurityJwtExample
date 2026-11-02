package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.exception.contract.ApplicationRejectedException;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadyActiveException;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadyExistsException;
import com.lacouf.rsbjwt.exception.contract.ContractNotFoundException;
import com.lacouf.rsbjwt.exception.contract.ContractNotPendingException;
import com.lacouf.rsbjwt.exception.contract.StudentAlreadyEmployedException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractStatus;
import com.lacouf.rsbjwt.model.contract.StudentConsent;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.StudentInternshipStatus;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import com.lacouf.rsbjwt.service.dto.response.contracts.ContractResponseDto;
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
import java.util.List;
import java.util.Optional;

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
    private static final long OTHER_APPLICATION_ID = 21L;
    private static final long CONTRACT_ID = 40L;
    private static final long OTHER_CONTRACT_ID = 41L;
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
        InternshipApplication application = application(APPLICATION_ID);

        // Act
        contractService.createContract(application);

        // Assert
        verify(contractRepository).save(contractArgumentCaptor.capture());

        Contract savedContract = contractArgumentCaptor.getValue();
        assertEquals(application, savedContract.getInternshipApplication());
        assertEquals(ContractStatus.PENDING, savedContract.getContractStatus());
        assertEquals(StudentConsent.PENDING, savedContract.getStudentConsent());
    }

    @Test
    void shouldThrowWhenContractAlreadyExistsForApplication() {
        // Arrange
        when(contractRepository.existsByInternshipApplicationId(APPLICATION_ID)).thenReturn(true);

        // Act + Assert
        assertThrows(ContractAlreadyExistsException.class, () -> contractService.createContract(application(APPLICATION_ID)));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldThrowWhenCreatingContractForRejectedApplication() {
        // Arrange
        InternshipApplication application = application(APPLICATION_ID);
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
        assertThrows(StudentAlreadyEmployedException.class, () -> contractService.createContract(application(APPLICATION_ID)));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    // ---------- studentAcceptsContract ----------

    @Test
    void shouldAcceptContractAndMarkStudentAsEmployed() throws Exception {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));

        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.of(contract));
        when(contractRepository.findByInternshipApplication_StudentAndContractStatus(student, ContractStatus.PENDING)).thenReturn(List.of(contract));

        // Act
        contractService.studentAcceptsContract(CONTRACT_ID, STUDENT_EMAIL);

        // Assert
        assertEquals(StudentConsent.ACCEPTED, contract.getStudentConsent());
        assertEquals(ContractStatus.ACTIVE, contract.getContractStatus());
        assertEquals(StudentInternshipStatus.EMPLOYED, student.getStudentInternshipStatus());
    }

    @Test
    void shouldTerminateOtherPendingContractsOfStudentWhenAcceptingContract() throws Exception {
        // Arrange
        Contract accepted = contract(CONTRACT_ID, application(APPLICATION_ID));
        Contract other = contract(OTHER_CONTRACT_ID, application(OTHER_APPLICATION_ID));

        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.of(accepted));
        when(contractRepository.findByInternshipApplication_StudentAndContractStatus(student, ContractStatus.PENDING)).thenReturn(List.of(accepted, other));

        // Act
        contractService.studentAcceptsContract(CONTRACT_ID, STUDENT_EMAIL);

        // Assert
        assertEquals(ContractStatus.ACTIVE, accepted.getContractStatus());
        assertEquals(StudentConsent.ACCEPTED, accepted.getStudentConsent());

        assertEquals(ContractStatus.TERMINATED, other.getContractStatus());
        assertEquals(StudentConsent.REJECTED, other.getStudentConsent());
    }

    @Test
    void shouldThrowWhenAcceptingUnknownOrNotOwnedContract() {
        // Arrange
        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(ContractNotFoundException.class, () -> contractService.studentAcceptsContract(CONTRACT_ID, STUDENT_EMAIL));

        assertEquals(StudentInternshipStatus.NOT_EMPLOYED, student.getStudentInternshipStatus());
    }

    @Test
    void shouldThrowWhenAcceptingContractOfDeletedInternship() {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));
        internship.markAsDeleted();

        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.of(contract));

        // Act + Assert
        assertThrows(ContractNotFoundException.class, () -> contractService.studentAcceptsContract(CONTRACT_ID, STUDENT_EMAIL));

        assertEquals(ContractStatus.PENDING, contract.getContractStatus());
        assertEquals(StudentInternshipStatus.NOT_EMPLOYED, student.getStudentInternshipStatus());
    }

    @Test
    void shouldThrowWhenAcceptingContractThatIsNotPending() {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));
        contract.setContractStatus(ContractStatus.ACTIVE);
        contract.setStudentConsent(StudentConsent.ACCEPTED);

        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.of(contract));

        // Act + Assert
        assertThrows(ContractNotPendingException.class, () -> contractService.studentAcceptsContract(CONTRACT_ID, STUDENT_EMAIL));

        assertEquals(StudentInternshipStatus.NOT_EMPLOYED, student.getStudentInternshipStatus());
    }

    @Test
    void shouldThrowWhenAcceptingContractAndStudentIsAlreadyEmployed() {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));
        student.setStudentInternshipStatus(StudentInternshipStatus.EMPLOYED);

        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.of(contract));

        // Act + Assert
        assertThrows(StudentAlreadyEmployedException.class, () -> contractService.studentAcceptsContract(CONTRACT_ID, STUDENT_EMAIL));

        assertEquals(ContractStatus.PENDING, contract.getContractStatus());
        assertEquals(StudentConsent.PENDING, contract.getStudentConsent());
        verify(contractRepository, never()).findByInternshipApplication_StudentAndContractStatus(any(), any());
    }

    // ---------- studentRejectsContract ----------

    @Test
    void shouldRejectContract() throws Exception {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));

        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.of(contract));

        // Act
        contractService.studentRejectsContract(CONTRACT_ID, STUDENT_EMAIL);

        // Assert
        assertEquals(StudentConsent.REJECTED, contract.getStudentConsent());
        assertEquals(ContractStatus.TERMINATED, contract.getContractStatus());
        assertEquals(StudentInternshipStatus.NOT_EMPLOYED, student.getStudentInternshipStatus());
    }

    @Test
    void shouldThrowWhenRejectingUnknownOrNotOwnedContract() {
        // Arrange
        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(ContractNotFoundException.class, () -> contractService.studentRejectsContract(CONTRACT_ID, STUDENT_EMAIL));
    }

    @Test
    void shouldThrowWhenRejectingContractAlreadyAccepted() {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));
        contract.setContractStatus(ContractStatus.ACTIVE);
        contract.setStudentConsent(StudentConsent.ACCEPTED);
        student.setStudentInternshipStatus(StudentInternshipStatus.EMPLOYED);

        when(contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(CONTRACT_ID, STUDENT_EMAIL)).thenReturn(Optional.of(contract));

        // Act + Assert
        assertThrows(ContractNotPendingException.class, () -> contractService.studentRejectsContract(CONTRACT_ID, STUDENT_EMAIL));

        assertEquals(ContractStatus.ACTIVE, contract.getContractStatus());
        assertEquals(StudentConsent.ACCEPTED, contract.getStudentConsent());
        assertEquals(StudentInternshipStatus.EMPLOYED, student.getStudentInternshipStatus());
    }

    // ---------- terminateForRejection ----------

    @Test
    void shouldDoNothingWhenRejectedApplicationHasNoContract() throws Exception {
        // Arrange
        InternshipApplication application = application(APPLICATION_ID);

        when(contractRepository.findByInternshipApplication(application)).thenReturn(Optional.empty());

        // Act
        contractService.terminateForRejection(application);

        // Assert
        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldTerminatePendingContractWhenApplicationIsRejected() throws Exception {
        // Arrange
        InternshipApplication application = application(APPLICATION_ID);
        Contract contract = contract(CONTRACT_ID, application);

        when(contractRepository.findByInternshipApplication(application)).thenReturn(Optional.of(contract));

        // Act
        contractService.terminateForRejection(application);

        // Assert
        assertEquals(ContractStatus.TERMINATED, contract.getContractStatus());
    }

    @Test
    void shouldThrowWhenRejectingApplicationWithActiveContract() {
        // Arrange
        InternshipApplication application = application(APPLICATION_ID);
        Contract contract = contract(CONTRACT_ID, application);
        contract.setContractStatus(ContractStatus.ACTIVE);

        when(contractRepository.findByInternshipApplication(application)).thenReturn(Optional.of(contract));

        // Act + Assert
        assertThrows(ContractAlreadyActiveException.class, () -> contractService.terminateForRejection(application));

        assertEquals(ContractStatus.ACTIVE, contract.getContractStatus());
    }

    // ---------- getContractsOfStudent / getContractsOfEmployer ----------

    @Test
    void shouldReturnContractsOfStudent() {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));

        when(contractRepository.findByInternshipApplication_Student(student)).thenReturn(List.of(contract));

        // Act
        List<ContractResponseDto> response = contractService.getContractsOfStudent(student);

        // Assert
        assertEquals(1, response.size());
        assertEquals(CONTRACT_ID, response.getFirst().id());
        assertEquals("PENDING", response.getFirst().contractStatus());
    }

    @Test
    void shouldNotReturnContractsOfDeletedInternshipForStudent() {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));
        internship.markAsDeleted();

        when(contractRepository.findByInternshipApplication_Student(student)).thenReturn(List.of(contract));

        // Act
        List<ContractResponseDto> response = contractService.getContractsOfStudent(student);

        // Assert
        assertTrue(response.isEmpty());
    }

    @Test
    void shouldReturnContractsOfEmployer() {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));

        when(contractRepository.findByInternshipApplication_Internship_PostedBy(employer)).thenReturn(List.of(contract));

        // Act
        List<ContractResponseDto> response = contractService.getContractsOfEmployer(employer);

        // Assert
        assertEquals(1, response.size());
        assertEquals(CONTRACT_ID, response.getFirst().id());
    }

    @Test
    void shouldNotReturnContractsOfDeletedInternshipForEmployer() {
        // Arrange
        Contract contract = contract(CONTRACT_ID, application(APPLICATION_ID));
        internship.markAsDeleted();

        when(contractRepository.findByInternshipApplication_Internship_PostedBy(employer)).thenReturn(List.of(contract));

        // Act
        List<ContractResponseDto> response = contractService.getContractsOfEmployer(employer);

        // Assert
        assertTrue(response.isEmpty());
    }

    // ---------- Helpers ----------

    private InternshipApplication application(long applicationId) {
        CV cv = new CV();
        cv.setId(5L);
        cv.setFileName("cv.pdf");

        InternshipApplication application = new InternshipApplication(internship, cv, student);
        application.setId(applicationId);

        return application;
    }

    private Contract contract(long contractId, InternshipApplication application) {
        Contract contract = new Contract(application);
        ReflectionTestUtils.setField(contract, "id", contractId);

        return contract;
    }
}