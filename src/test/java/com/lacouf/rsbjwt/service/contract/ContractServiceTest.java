package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.exception.contract.*;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractLanguage;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.*;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ContractServiceTest {

    private static final long APPLICATION_ID = 20L;

    private static final String STUDENT_EMAIL = "student@example.com";
    private static final String EMPLOYER_EMAIL = "email@example.com";
    private static final String MANAGER_EMAIL = "gestion.stages@claurendeau.qc.ca";
    private static final String MANAGER_PASSWORD = "John123#";
    private static final String OTHER_EMAIL = "other@example.com";

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 10, 14, 30);

    private ContractService contractService;

    @Mock
    private ContractPdfGenerator contractPdfGenerator;

    @Mock
    private ContractRepository contractRepository;
    @Mock
    private ManagerRepository managerRepository;

    @Mock
    private UserAppService userAppService;
    @Mock
    private AcademicSessionService academicSessionService;
    @Mock
    private NotificationService notificationService;

    @Captor
    private ArgumentCaptor<Contract> contractArgumentCaptor;

    private Employer employer;
    private Internship internship;
    private Student student;

    @BeforeEach
    void setUp() {
        ZoneId zone = ZoneId.systemDefault();
        contractService = new ContractService(contractPdfGenerator, contractRepository, managerRepository, userAppService, academicSessionService, notificationService, Clock.fixed(NOW.atZone(zone).toInstant(), zone));

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

        saveContractWithId();

        // Act
        contractService.createContract(application);

        // Assert
        verify(contractRepository).save(contractArgumentCaptor.capture());

        Contract savedContract = contractArgumentCaptor.getValue();

        assert internship.equals(savedContract.getInternship());
    }

    @Test
    void shouldCopyStudentAndEmployerFromApplicationWhenCreatingContract() throws Exception {
        // Arrange
        InternshipApplication application = offeredApplication();

        saveContractWithId();

        // Act
        contractService.createContract(application);

        // Assert
        verify(contractRepository).save(contractArgumentCaptor.capture());

        Contract savedContract = contractArgumentCaptor.getValue();

        assert student.equals(savedContract.getStudent());
        assert employer.equals(savedContract.getEmployer());
    }

    @Test
    void shouldSetCreationDateWhenCreatingContract() throws Exception {
        // Arrange
        InternshipApplication application = offeredApplication();

        saveContractWithId();

        // Act
        contractService.createContract(application);

        // Assert
        verify(contractRepository).save(contractArgumentCaptor.capture());

        Contract savedContract = contractArgumentCaptor.getValue();

        assert NOW.equals(savedContract.getCreatedAt());
    }

    @Test
    void shouldNotifyEveryManagerOfContractToSignWhenCreatingContract() throws Exception {
        // Arrange
        Manager firstManager = manager();
        Manager secondManager = manager();

        saveContractWithId();

        when(managerRepository.findAll()).thenReturn(List.of(firstManager, secondManager));

        // Act
        contractService.createContract(offeredApplication());

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.CONTRACT_TO_SIGN_BY_MANAGER, 30L, firstManager);
        verify(notificationService).notifyIfAbsent(NotificationType.CONTRACT_TO_SIGN_BY_MANAGER, 30L, secondManager);
    }

    // ==========================================
    // Contract List Tests
    // ==========================================

    @Test
    void shouldReturnContractsOfChosenSessionWhenManagerGetsContracts() throws UserNotFoundException, AcademicSessionNotFoundException {
        // Arrange
        Contract contract = contract();

        when(contractRepository.findByInternship_Session(internship.getSession())).thenReturn(List.of(contract));
        when(userAppService.findUserByEmail(MANAGER_EMAIL)).thenReturn(manager());
        when(academicSessionService.findSessionOrCurrent(1L)).thenReturn(internship.getSession());

        // Act
        List<ContractResponseDto> contracts = contractService.getContracts(MANAGER_EMAIL, 1L);

        // Assert
        assert contracts.size() == 1;
        assert "Jane Doe".equals(contracts.getFirst().studentName());
        assert "Company Name".equals(contracts.getFirst().companyName());
        assert "Software Developer".equals(contracts.getFirst().internship().title());
        assert new BigDecimal("25.00").equals(contracts.getFirst().internship().compensationAmount());
        assert internship.getStartDate().plusWeeks(16).minusDays(1).equals(contracts.getFirst().internshipEndDate());
        assert contracts.getFirst().managerName() == null;
        assert contracts.getFirst().managerSignedAt() == null;
    }

    @Test
    void shouldReturnOnlyContractsNotSignedByManagerWhenManagerGetsContractsToSign() throws Exception {
        // Arrange
        Contract signedContract = contract();
        signedContract.sign(ContractParty.MANAGER, manager(), NOW.minusDays(1));

        when(userAppService.findUserByEmail(MANAGER_EMAIL)).thenReturn(manager());
        when(contractRepository.findAll()).thenReturn(List.of(contract(), signedContract));

        // Act
        List<ContractResponseDto> contracts = contractService.getContractsToSign(MANAGER_EMAIL);

        // Assert
        assert contracts.size() == 1;
        assert contracts.getFirst().managerSignedAt() == null;
    }

    // ==========================================
    // Manager Signature Tests
    // ==========================================

    @Test
    void shouldSignAsManagerAndCloseNotificationsWhenManagerSignsContract() throws Exception {
        // Arrange
        Contract contract = contract();
        Manager manager = manager();

        when(userAppService.findUserByEmail(MANAGER_EMAIL)).thenReturn(manager);
        when(contractRepository.findById(30L)).thenReturn(Optional.of(contract));
        when(contractRepository.save(contract)).thenReturn(contract);

        // Act
        ContractResponseDto contractResponseDto = contractService.signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD);

        // Assert
        assert manager.equals(contract.getManager());
        assert NOW.equals(contractResponseDto.managerSignedAt());
        assert contractResponseDto.studentSignedAt() == null;

        verify(userAppService).verifyIfSignaturePasswordIsIncorrect(manager, MANAGER_PASSWORD);
        verify(notificationService).closeNotificationsOfType(NotificationType.CONTRACT_TO_SIGN_BY_MANAGER, 30L);
    }

    @Test
    void shouldNotSignContractWhenSignaturePasswordIsIncorrect() throws Exception {
        // Arrange
        Manager manager = manager();

        when(userAppService.findUserByEmail(MANAGER_EMAIL)).thenReturn(manager);

        doThrow(new IncorrectSignaturePasswordException()).when(userAppService).verifyIfSignaturePasswordIsIncorrect(manager, MANAGER_PASSWORD);

        // Act + Assert
        assertThrows(IncorrectSignaturePasswordException.class, () -> contractService.signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD));

        verifyNoInteractions(contractRepository, notificationService);
    }

    @Test
    void shouldSignWithoutPasswordWhenDevSigningContract() throws Exception {
        // Arrange
        Contract contract = contract();

        when(userAppService.findUserByEmail(MANAGER_EMAIL)).thenReturn(manager());
        when(contractRepository.findById(30L)).thenReturn(Optional.of(contract));
        when(contractRepository.save(contract)).thenReturn(contract);

        // Act
        contractService.devSignContract(MANAGER_EMAIL, 30L);

        // Assert
        assert NOW.equals(contract.getManagerSignedAt());

        verify(userAppService, never()).verifyIfSignaturePasswordIsIncorrect(any(), any());
    }

    @Test
    void shouldThrowContractAlreadySignedExceptionWhenPartySignsTwice() throws Exception {
        // Arrange
        Contract contract = contract();
        contract.sign(ContractParty.MANAGER, manager(), NOW.minusDays(1));

        when(userAppService.findUserByEmail(MANAGER_EMAIL)).thenReturn(manager());
        when(contractRepository.findById(30L)).thenReturn(Optional.of(contract));

        // Act + Assert
        assertThrows(ContractAlreadySignedException.class, () -> contractService.devSignContract(MANAGER_EMAIL, 30L));

        assert NOW.minusDays(1).equals(contract.getManagerSignedAt());

        verify(contractRepository, never()).save(any(Contract.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldThrowContractNotFoundExceptionWhenSignerIsNotPartyOfContract() throws Exception {
        // Arrange
        when(userAppService.findUserByEmail(OTHER_EMAIL)).thenReturn(otherStudent());
        when(contractRepository.findById(30L)).thenReturn(Optional.of(contract()));

        // Act + Assert
        assertThrows(ContractNotFoundException.class, () -> contractService.devSignContract(OTHER_EMAIL, 30L));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    // ==========================================
    // Contract File Tests
    // ==========================================

    @Test
    void shouldReturnGeneratedPdfWhenGettingContractFile() throws Exception {
        // Arrange
        Contract contract = contract();

        when(contractRepository.findById(30L)).thenReturn(Optional.of(contract));
        when(contractPdfGenerator.generate(contract, ContractLanguage.EN)).thenReturn("pdf".getBytes());
        when(userAppService.findUserByEmail(MANAGER_EMAIL)).thenReturn(manager());

        // Act
        DocumentFileResponseDto file = contractService.getContractFile(MANAGER_EMAIL, 30L, ContractLanguage.EN);

        // Assert
        assert "contrat-30.pdf".equals(file.fileName());
        assert Arrays.equals("pdf".getBytes(), file.content());
    }

    // ==========================================
    // Contract Creation Validation Tests
    // ==========================================

    @Test
    void shouldThrowContractAlreadyExistsExceptionWhenContractAlreadyExistsForApplication() {
        // Arrange
        when(contractRepository.existsByStudentAndInternship(student, internship)).thenReturn(true);

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
        when(contractRepository.existsByStudentAndInternship(student, internship)).thenReturn(true);

        InternshipApplication application = applicationWithDecision(EmployerDecision.REJECTED);

        // Act + Assert
        assertThrows(ContractAlreadyExistsException.class, () -> contractService.createContract(application));

        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void shouldReturnContractsOfEmployerWhenEmployerGetsContracts() throws Exception {
        // Arrange
        givenUserWithEmail(employer);

        when(academicSessionService.findSessionOrCurrent(null)).thenReturn(internship.getSession());
        when(contractRepository.findByInternship_Session(internship.getSession())).thenReturn(List.of(contract()));

        // Act
        List<ContractResponseDto> contracts = contractService.getContracts(EMPLOYER_EMAIL, null);

        // Assert
        assert contracts.size() == 1;
        assert "Company Name".equals(contracts.getFirst().companyName());
    }

    @Test
    void shouldNotifyEmployerOfContractToSignWhenCreatingContract() throws Exception {
        // Arrange
        saveContractWithId();

        // Act
        contractService.createContract(offeredApplication());

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.CONTRACT_TO_SIGN_BY_EMPLOYER, 30L, employer);
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

    private Contract contract() {
        Contract contract = new Contract(offeredApplication(), NOW);
        contract.setId(30L);

        return contract;
    }

    private static Manager manager() {
        Credentials credentials = Credentials.builder().email(MANAGER_EMAIL).role(Role.MANAGER).build();

        return new Manager("John", "Doe", credentials, "450-555-0000");
    }

    private void saveContractWithId() {
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract contract = invocation.getArgument(0);
            contract.setId(30L);
            return contract;
        });
    }

    private static Student otherStudent() {
        Credentials credentials = Credentials.builder().email(OTHER_EMAIL).role(Role.STUDENT).build();
        Student otherStudent = new Student("Paul", "Martin", "7654321", credentials, Discipline.COMPUTER_SCIENCE, null);
        otherStudent.setId(99L);

        return otherStudent;
    }

    private void givenUserWithEmail(UserApp user) throws UserNotFoundException {
        when(userAppService.findUserByEmail(user.getEmail())).thenReturn(user);
    }
}