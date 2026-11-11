package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.document.DocumentNotFoundException;
import com.lacouf.rsbjwt.exception.document.student.cv.CVUsedInApplicationException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.exception.internship.PastSessionInternshipNotEditableException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.document.student.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.service.contract.ContractService;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.internship.InternshipService;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.answer;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ManagerServiceTest {

    @InjectMocks
    private ManagerService managerService;

    @Mock
    private NotificationService notificationService;
    @Mock
    private UserAppService userAppService;
    @Mock
    private AcademicSessionService academicSessionService;
    @Mock
    private ContractService contractService;

    @Mock
    private ManagerRepository managerRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private CVRepository cvRepository;
    @Mock
    private InternshipRepository internshipRepository;
    @Mock
    private InternshipApplicationRepository applicationRepository;

    @Captor
    private ArgumentCaptor<Manager> managerArgumentCaptor;

    @Spy
    private InternshipService internshipService;

    private CV cv;
    private Internship internship;
    private AcademicSession currentSession;

    @BeforeEach
    void setUp() {
        currentSession = new AcademicSession(Season.WINTER, 2027);
        currentSession.setId(1L);

        Student student = new Student("Marie", "Tremblay", "2234567", Credentials.builder().email("marie@example.com").role(Role.STUDENT).build(), Discipline.COMPUTER_SCIENCE, null);
        student.setId(2L);

        cv = new CV("pdf".getBytes(), "cv.pdf", LocalDateTime.of(2026, 9, 1, 10, 0), currentSession);
        cv.setId(1L);
        student.addCv(cv);

        Employer employer = new Employer("Jean", "Dupont", Credentials.builder().email("employer@example.com").role(Role.EMPLOYER).build(), "Tech Corp", Discipline.COMPUTER_SCIENCE, "514-123-4567");
        employer.setId(3L);

        internship = new Internship("Développeur logiciel",
                "Stage en développement logiciel",
                "Java, Spring Boot",
                16,
                "Montréal",
                WorkMode.HYBRID,
                LocalDate.of(2027, 1, 10),
                LocalDate.of(2026, 12, 1),
                new BigDecimal("25.00"),
                false,
                employer,
                currentSession
        );

        internship.setId(1L);
    }

    @Test
    void shouldSaveManager() throws UserAlreadyExistsException {
        // Arrange
        Credentials credentials = Credentials.builder().email("manager@example.com").password("Test123@-encoded").role(Role.MANAGER).build();

        when(userAppService.createCredentials("manager@example.com", "Test123@", Role.MANAGER)).thenReturn(credentials);
        when(userAppService.formatPhoneNumber("5141234567")).thenReturn("514-123-4567");

        when(managerRepository.save(any(Manager.class)))
                .thenAnswer(answer((Manager manager) -> {
                    manager.setId(1L);
                    return manager;
                }));

        // Act
        managerService.save("First Name", "Last Name", "manager@example.com", "Test123@", "5141234567");

        // Assert
        verify(managerRepository).save(managerArgumentCaptor.capture());

        Manager savedManager = managerArgumentCaptor.getValue();
        assert (savedManager.getFirstName()).equals("First Name");
        assert (savedManager.getLastName()).equals("Last Name");
        assert (savedManager.getEmail()).equals("manager@example.com");
        assert (savedManager.getPassword()).equals("Test123@-encoded");
        assert (savedManager.getRole()).equals(Role.MANAGER);
        assert (savedManager.getPhoneNumber()).equals("514-123-4567");
    }

    @Test
    void shouldReturnPendingVisibleCvsWhenGettingPendingCvs() {
        // Arrange
        when(cvRepository.findByVisibilityAndStatus(DocumentVisibility.VISIBLE, ReviewStatus.PENDING)).thenReturn(List.of(cv));

        // Act
        List<ManagerCvResponseDto> result = managerService.getPendingCvs();

        // Assert
        assert (Integer.valueOf(1)).equals(result.size());
        assert ("Marie").equals(result.getFirst().student().firstName());
    }

    @Test
    void shouldReturnVisibleCvsUploadedForChosenSession() throws AcademicSessionNotFoundException {
        // Arrange
        when(academicSessionService.findSessionOrCurrent(1L)).thenReturn(currentSession);
        when(cvRepository.findByVisibilityAndSession(DocumentVisibility.VISIBLE, currentSession)).thenReturn(List.of(cv));

        // Act
        List<ManagerCvResponseDto> result = managerService.getVisibleCvs(1L);

        // Assert
        assert (Integer.valueOf(1)).equals(result.size());
        assert ("Marie").equals(result.getFirst().student().firstName());
    }

    @Test
    void shouldFlagCvUsedInApplicationWhenListingCvs() throws AcademicSessionNotFoundException {
        // Arrange
        when(academicSessionService.findSessionOrCurrent(1L)).thenReturn(currentSession);
        when(cvRepository.findByVisibilityAndSession(DocumentVisibility.VISIBLE, currentSession)).thenReturn(List.of(cv));
        when(applicationRepository.existsByCv(cv)).thenReturn(true);

        // Act
        List<ManagerCvResponseDto> visibleCvs = managerService.getVisibleCvs(1L);

        // Assert
        assert visibleCvs.getFirst().usedInApplication();
    }

    @Test
    void shouldReturnEmptyListWhenNoVisibleCvs() throws AcademicSessionNotFoundException {
        // Arrange
        when(academicSessionService.findSessionOrCurrent(null)).thenReturn(currentSession);
        when(cvRepository.findByVisibilityAndSession(DocumentVisibility.VISIBLE, currentSession)).thenReturn(List.of());

        // Act
        List<ManagerCvResponseDto> result = managerService.getVisibleCvs(null);

        // Assert
        assert result.isEmpty();
    }

    @Test
    void shouldReturnVisibleCv() throws DocumentNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.getCv(1L);

        // Assert
        assert (Long.valueOf(1L)).equals(result.id());
        assert ("2234567").equals(result.student().studentId());
    }

    @Test
    void shouldThrowCvNotFoundWhenCvIsHiddenOrDoesNotExist() {
        // Arrange
        when(cvRepository.findByIdAndVisibility(99L, DocumentVisibility.VISIBLE)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(DocumentNotFoundException.class, () -> managerService.getCv(99L));
    }

    @Test
    void shouldReturnCvFile() throws DocumentNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        DocumentFileResponseDto result = managerService.getCvFile(1L);

        // Assert
        assert ("cv.pdf").equals(result.fileName());
        assert Arrays.equals("pdf".getBytes(), result.content());
    }

    @Test
    void shouldThrowCvNotFoundWhenGettingFileOfUnknownCv() {
        // Arrange
        when(cvRepository.findByIdAndVisibility(99L, DocumentVisibility.VISIBLE)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(DocumentNotFoundException.class, () -> managerService.getCvFile(99L));
    }

    @Test
    void shouldApproveCv() throws DocumentNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.approveCv(1L);

        // Assert
        assert (ReviewStatus.APPROVED).equals(cv.getStatus());
        assert (ReviewStatus.APPROVED).equals(result.status());
        assert result.rejectionComment() == null;

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldClearRejectionCommentWhenApprovingPreviouslyRejectedCv() throws DocumentNotFoundException {
        // Arrange
        cv.setStatus(ReviewStatus.REJECTED);
        cv.setRejectionComment("CV too detailed");
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.approveCv(1L);

        // Assert
        assert (ReviewStatus.APPROVED).equals(cv.getStatus());
        assert cv.getRejectionComment() == null;
        assert (ReviewStatus.APPROVED).equals(result.status());
        assert result.rejectionComment() == null;

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldReturnCvWithoutSavingWhenApprovingAlreadyApprovedCv() throws DocumentNotFoundException {
        // Arrange
        cv.setStatus(ReviewStatus.APPROVED);
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.approveCv(1L);

        // Assert
        assert (ReviewStatus.APPROVED).equals(result.status());
        assert (ReviewStatus.APPROVED).equals(cv.getStatus());

        verify(cvRepository, never()).save(any(CV.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldThrowCvNotFoundWhenApprovingUnknownCv() {
        // Arrange
        when(cvRepository.findByIdAndVisibility(99L, DocumentVisibility.VISIBLE)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(DocumentNotFoundException.class, () -> managerService.approveCv(99L));

        verify(cvRepository, never()).save(any(CV.class));
    }

    @Test
    void shouldRejectCvWithComment() throws Exception {
        // Arrange
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.rejectCv(1L, "CV too detailed");

        // Assert
        assert (ReviewStatus.REJECTED).equals(cv.getStatus());
        assert ("CV too detailed").equals(cv.getRejectionComment());
        assert (ReviewStatus.REJECTED).equals(result.status());
        assert ("CV too detailed").equals(result.rejectionComment());

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCvNotFoundWhenRejectingUnknownCv() {
        // Arrange
        when(cvRepository.findByIdAndVisibility(99L, DocumentVisibility.VISIBLE)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(DocumentNotFoundException.class, () -> managerService.rejectCv(99L, "CV too detailed"));

        verify(cvRepository, never()).save(any(CV.class));
    }

    @Test
    void shouldThrowCVUsedInApplicationWhenRejectingCvUsedInApplication() {
        // Arrange
        cv.setStatus(ReviewStatus.APPROVED);

        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));
        when(applicationRepository.existsByCv(cv)).thenReturn(true);

        // Act + Assert
        assertThrows(CVUsedInApplicationException.class, () -> managerService.rejectCv(1L, "CV too detailed"));

        assert (ReviewStatus.APPROVED).equals(cv.getStatus());
        verify(cvRepository, never()).save(any(CV.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldAllowRejectingPreviouslyApprovedCv() throws Exception {
        // Arrange
        cv.setStatus(ReviewStatus.APPROVED);
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.rejectCv(1L, "Changed my mind");

        // Assert
        assert (ReviewStatus.REJECTED).equals(cv.getStatus());
        assert ("Changed my mind").equals(cv.getRejectionComment());
        assert (ReviewStatus.REJECTED).equals(result.status());

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldAllowRejectingAlreadyRejectedCvWithNewComment() throws Exception {
        // Arrange
        cv.setStatus(ReviewStatus.REJECTED);
        cv.setRejectionComment("Old comment");
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.rejectCv(1L, "New comment");

        // Assert
        assert (ReviewStatus.REJECTED).equals(cv.getStatus());
        assert ("New comment").equals(cv.getRejectionComment());
        assert ("New comment").equals(result.rejectionComment());

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldReturnPendingInternships() {
        //Arrange
        when(internshipRepository.findByStatusAndDeletedFalse(ReviewStatus.PENDING)).thenReturn(List.of(internship));

        //Act
        List<InternshipResponseDto> result = managerService.getPendingInternships();

        //Assert
        assert (Integer.valueOf(1)).equals(result.size());
        assert (ReviewStatus.PENDING).equals(result.getFirst().status());
    }

    @Test
    void shouldReturnAllInternships() throws AcademicSessionNotFoundException {
        //Arrange
        when(academicSessionService.findSessionOrCurrent(null)).thenReturn(currentSession);
        when(internshipRepository.findBySessionAndDeletedFalse(currentSession)).thenReturn(List.of(internship));

        //Act
        List<InternshipResponseDto> result = managerService.getAllInternships(null);

        //Assert
        assert (Integer.valueOf(1)).equals(result.size());
        assert ("Développeur logiciel").equals(result.getFirst().title());
    }

    @Test
    void shouldReturnInternshipsOfChosenSessionWhenSessionIsGiven() throws AcademicSessionNotFoundException {
        //Arrange
        AcademicSession pastSession = new AcademicSession(Season.WINTER, 2026);
        pastSession.setId(2L);

        when(academicSessionService.findSessionOrCurrent(2L)).thenReturn(pastSession);
        when(internshipRepository.findBySessionAndDeletedFalse(pastSession)).thenReturn(List.of());

        //Act
        List<InternshipResponseDto> result = managerService.getAllInternships(2L);

        //Assert
        assert result.isEmpty();
    }

    @Test
    void shouldReturnInternshipById() throws InternshipNotFoundException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.getInternshipById(1L);

        //Assert
        assert (Long.valueOf(1L)).equals(result.id());
        assert ("Développeur logiciel").equals(result.title());
        assert (ReviewStatus.PENDING).equals(result.status());
    }

    @Test
    void shouldThrowInternshipNotFoundExceptionWhenInternshipDoesNotExist() {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        //Act + assert
        assertThrows(InternshipNotFoundException.class, () -> managerService.getInternshipById(99L));
    }

    @Test
    void shouldApproveInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.approveInternship(1L);

        //Assert
        assert (ReviewStatus.APPROVED).equals(internship.getStatus());
        assert (ReviewStatus.APPROVED).equals(result.status());
        assert internship.getRejectionComment() == null;

        verify(internshipRepository).save(internship);
    }

    @Test
    void shouldReturnInternshipWithoutSavingWhenApprovingAlreadyApprovedInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        //Arrange
        internship.approve();

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.approveInternship(1L);

        //Assert
        assert (ReviewStatus.APPROVED).equals(result.status());

        verify(internshipRepository, never()).save(any(Internship.class));
        verifyNoInteractions(studentRepository, notificationService);
    }

    @Test
    void shouldRejectInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.rejectInternship(1L, "Ur offer sucks.");

        //Assert
        assert (ReviewStatus.REJECTED).equals(internship.getStatus());
        assert (ReviewStatus.REJECTED).equals(result.status());
        assert ("Ur offer sucks.").equals(internship.getRejectionComment());
        assert ("Ur offer sucks.").equals(result.rejectionComment());

        verify(internshipRepository).save(internship);
    }

    @Test
    void shouldThrowInternshipNotFoundWhenApprovingUnknownInternship() {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        //Act + assert
        assertThrows(InternshipNotFoundException.class, () -> managerService.approveInternship(99L));

        verify(internshipRepository, never()).save(any(Internship.class));
    }

    @Test
    void shouldThrowInternshipNotFoundWhenRejectingUnknownInternship() {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        //Act + assert
        assertThrows(InternshipNotFoundException.class, () -> managerService.rejectInternship(99L, "Who's there?"));

        verify(internshipRepository, never()).save(any(Internship.class));
    }

    @Test
    void shouldThrowPastSessionInternshipNotEditableWhenApprovingPastInternship() throws PastSessionInternshipNotEditableException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        doThrow(new PastSessionInternshipNotEditableException(currentSession)).when(academicSessionService).verifyInternshipIsInTargetSession(currentSession);

        //Act + assert
        assertThrows(PastSessionInternshipNotEditableException.class, () -> managerService.approveInternship(1L));

        verify(internshipRepository, never()).save(any(Internship.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldThrowPastSessionInternshipNotEditableWhenRejectingPastInternship() throws PastSessionInternshipNotEditableException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        doThrow(new PastSessionInternshipNotEditableException(currentSession)).when(academicSessionService).verifyInternshipIsInTargetSession(currentSession);

        //Act + assert
        assertThrows(PastSessionInternshipNotEditableException.class, () -> managerService.rejectInternship(1L, "Too late."));

        verify(internshipRepository, never()).save(any(Internship.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldApproveAndNotifyWhenManagerUpdatesPendingInternship() throws Exception {
        //Arrange
        InternshipRequestDto internshipRequestDto = internshipRequestWith(internship.getStartDate(), new BigDecimal("27.00"));

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto updatedInternship = managerService.updateInternship(1L, internshipRequestDto);

        //Assert
        assert ("Développeur backend").equals(updatedInternship.title());
        assert (ReviewStatus.APPROVED).equals(updatedInternship.status());

        verify(internshipRepository).save(internship);
        verify(notificationService).notifyIfAbsent(NotificationType.INTERNSHIP_OFFER_APPROVED,
                NotificationType.INTERNSHIP_OFFER_APPROVED.getMessage(), 1L, internship.getPostedBy());
    }

    @Test
    void shouldNotNotifyWhenManagerUpdatesAlreadyApprovedInternship() throws Exception {
        //Arrange
        internship.approve();
        InternshipRequestDto internshipRequestDto = internshipRequestWith(internship.getStartDate(), new BigDecimal("27.00"));

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto updatedInternship = managerService.updateInternship(1L, internshipRequestDto);

        //Assert
        assert ("Développeur backend").equals(updatedInternship.title());
        assert (new BigDecimal("27.00")).equals(updatedInternship.compensationAmount());
        assert (ReviewStatus.APPROVED).equals(updatedInternship.status());

        verify(internshipRepository).save(internship);
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldThrowInvalidInternshipDateWhenManagerChangesStartDateToPast() {
        //Arrange
        InternshipRequestDto internshipRequestDto = internshipRequestWith(LocalDate.now().minusDays(1), new BigDecimal("25.00"));

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act + assert
        assertThrows(InvalidInternshipDateException.class, () -> managerService.updateInternship(1L, internshipRequestDto));

        verify(internshipRepository, never()).save(any(Internship.class));
    }

    @Test
    void shouldThrowInvalidCompensationWhenManagerRemovesAmountWithoutNegotiable() {
        //Arrange
        InternshipRequestDto internshipRequestDto = internshipRequestWith(internship.getStartDate(), null);

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act + assert
        assertThrows(InvalidCompensationException.class, () -> managerService.updateInternship(1L, internshipRequestDto));

        verify(internshipRepository, never()).save(any(Internship.class));
    }

    @Test
    void shouldThrowPastSessionInternshipNotEditableWhenManagerUpdatesPastInternship() throws Exception {
        //Arrange
        InternshipRequestDto internshipRequestDto = internshipRequestWith(internship.getStartDate(), new BigDecimal("27.00"));

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));
        when(academicSessionService.getTargetSessionForUpdate(currentSession, internship.getStartDate())).thenThrow(new PastSessionInternshipNotEditableException(currentSession));

        //Act + assert
        assertThrows(PastSessionInternshipNotEditableException.class, () -> managerService.updateInternship(1L, internshipRequestDto));

        verify(internshipRepository, never()).save(any(Internship.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldAllowApprovingRejectedInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        //Arrange
        internship.reject("Offer is no good.");

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.approveInternship(1L);

        // Assert
        assert (ReviewStatus.APPROVED).equals(internship.getStatus());
        assert internship.getRejectionComment() == null;
        assert (ReviewStatus.APPROVED).equals(result.status());
        assert result.rejectionComment() == null;

        verify(internshipRepository).save(internship);
        verify(studentRepository).findByDiscipline(Discipline.COMPUTER_SCIENCE);
    }

    @Test
    void shouldAllowRejectingPreviouslyApprovedInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        // Arrange
        internship.approve();

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        // Act
        InternshipResponseDto result = managerService.rejectInternship(1L, "Offer does not meet requirements.");

        // Assert
        assert (ReviewStatus.REJECTED).equals(internship.getStatus());
        assert ("Offer does not meet requirements.").equals(internship.getRejectionComment());
        assert (ReviewStatus.REJECTED).equals(result.status());

        verify(internshipRepository).save(internship);
    }

    @Test
    void shouldAllowUpdatingRejectionComment() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        // Arrange
        internship.reject("Old comment.");

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        // Act
        InternshipResponseDto result = managerService.rejectInternship(1L, "New comment.");

        // Assert
        assert (ReviewStatus.REJECTED).equals(internship.getStatus());
        assert ("New comment.").equals(internship.getRejectionComment());
        assert ("New comment.").equals(result.rejectionComment());

        verify(internshipRepository).save(internship);
    }

    @Test
    void shouldNotifyStudentWhenApprovingCv() throws DocumentNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        managerService.approveCv(1L);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.CV_APPROVED, "Your CV has been approved.", 1L, cv.getStudent());
    }

    @Test
    void shouldNotifyStudentWithRejectionCommentWhenRejectingCv() throws DocumentNotFoundException, CVUsedInApplicationException {
        // Arrange
        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        managerService.rejectCv(1L, "CV too detailed");

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.CV_REJECTED, "CV too detailed", 1L, cv.getStudent());
    }

    @Test
    void shouldNotNotifyStudentWhenRejectingWithSameComment() throws DocumentNotFoundException, CVUsedInApplicationException {
        // Arrange
        cv.setStatus(ReviewStatus.REJECTED);
        cv.setRejectionComment("CV too detailed");

        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.rejectCv(1L, "CV too detailed");

        // Assert
        assert ("CV too detailed").equals(result.rejectionComment());

        verify(cvRepository, never()).save(any(CV.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldCloseOldCvNotificationsBeforeNotifyingStudentOfNewDecision() throws DocumentNotFoundException, CVUsedInApplicationException {
        // Arrange
        cv.setStatus(ReviewStatus.APPROVED);

        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        managerService.rejectCv(1L, "Changed my mind");

        // Assert
        InOrder inOrder = inOrder(notificationService);
        inOrder.verify(notificationService).closeNotificationsOfTarget(TargetType.CV, 1L);
        inOrder.verify(notificationService).notifyIfAbsent(NotificationType.CV_REJECTED, "Changed my mind", 1L, cv.getStudent());
    }

    @Test
    void shouldNotifyStudentsWithApprovedCvWhenApprovingInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        // Arrange
        Student student = cv.getStudent();

        cv.setStatus(ReviewStatus.APPROVED);

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));
        when(studentRepository.findByDiscipline(Discipline.COMPUTER_SCIENCE)).thenReturn(List.of(student));
        when(cvRepository.findByUser(student)).thenReturn(List.of(cv));

        // Act
        managerService.approveInternship(1L);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.NEW_INTERNSHIP_OFFER, 1L, student);
    }

    @Test
    void shouldNotifyStudentOfOpenInternshipsWhenFirstCvIsApproved() throws DocumentNotFoundException {
        // Arrange
        internship.approve();

        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));
        when(internshipRepository.findByPostedBy_DisciplineAndStatusAndDeletedFalseAndApplicationDeadlineGreaterThanEqual(Discipline.COMPUTER_SCIENCE, ReviewStatus.APPROVED, LocalDate.now()))
                .thenReturn(List.of(internship));

        // Act
        managerService.approveCv(1L);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.NEW_INTERNSHIP_OFFER, 1L, cv.getStudent());
    }

    @Test
    void shouldNotNotifyStudentOfOpenInternshipsWhenStudentAlreadyHasApprovedCv() throws DocumentNotFoundException {
        // Arrange
        CV approvedCv = new CV("pdf".getBytes(), "old.pdf", LocalDateTime.of(2026, 8, 1, 10, 0), currentSession);

        approvedCv.setStatus(ReviewStatus.APPROVED);

        when(cvRepository.findByIdAndVisibility(1L, DocumentVisibility.VISIBLE)).thenReturn(Optional.of(cv));
        when(cvRepository.findByUser(cv.getStudent())).thenReturn(List.of(approvedCv));

        // Act
        managerService.approveCv(1L);

        // Assert
        verify(internshipRepository, never()).findByPostedBy_DisciplineAndStatusAndDeletedFalseAndApplicationDeadlineGreaterThanEqual(any(), any(), any());
        verify(notificationService, never()).notifyIfAbsent(eq(NotificationType.NEW_INTERNSHIP_OFFER), anyLong(), any());
    }

    @Test
    void shouldNotNotifyStudentsWithoutApprovedCvWhenApprovingInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        // Arrange
        Student student = cv.getStudent();

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));
        when(studentRepository.findByDiscipline(Discipline.COMPUTER_SCIENCE)).thenReturn(List.of(student));
        when(cvRepository.findByUser(student)).thenReturn(List.of(cv));

        // Act
        managerService.approveInternship(1L);

        // Assert
        verify(notificationService, never()).notifyIfAbsent(eq(NotificationType.NEW_INTERNSHIP_OFFER), anyLong(), any(UserApp.class));
    }

    @Test
    void shouldNotNotifyStudentsWhoseApprovedCvIsHiddenWhenApprovingInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        // Arrange
        Student student = cv.getStudent();

        cv.setStatus(ReviewStatus.APPROVED);
        cv.setVisibility(DocumentVisibility.HIDDEN);

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));
        when(studentRepository.findByDiscipline(Discipline.COMPUTER_SCIENCE)).thenReturn(List.of(student));
        when(cvRepository.findByUser(student)).thenReturn(List.of(cv));

        // Act
        managerService.approveInternship(1L);

        // Assert
        verify(notificationService, never()).notifyIfAbsent(eq(NotificationType.NEW_INTERNSHIP_OFFER), anyLong(), any(UserApp.class));
    }

    @Test
    void shouldNotifyEmployerWhenApprovingInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        // Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        // Act
        managerService.approveInternship(1L);

        // Assert
        InOrder inOrder = inOrder(notificationService);

        inOrder.verify(notificationService).closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, 1L);
        inOrder.verify(notificationService).notifyIfAbsent(NotificationType.INTERNSHIP_OFFER_APPROVED,
                NotificationType.INTERNSHIP_OFFER_APPROVED.getMessage(), 1L, internship.getPostedBy());
    }

    @Test
    void shouldNotifyEmployerWithCommentWhenRejectingInternship() throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        // Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        // Act
        managerService.rejectInternship(1L, "Offer is no good.");

        // Assert
        InOrder inOrder = inOrder(notificationService);

        inOrder.verify(notificationService).closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, 1L);
        inOrder.verify(notificationService).notifyIfAbsent(NotificationType.INTERNSHIP_OFFER_REJECTED,
                "Offer is no good.", 1L, internship.getPostedBy());
    }

    @Test
    void shouldReturnContractsOfChosenSessionWhenGettingContracts() throws AcademicSessionNotFoundException {
        // Arrange
        ContractResponseDto contract = new ContractResponseDto(30L, InternshipResponseDto.of(internship), LocalDate.of(2027, 5, 2), "Marie Tremblay", "Jean Dupont", "Tech Corp", null, LocalDateTime.of(2026, 11, 10, 14, 30), null, null, null);

        when(academicSessionService.findSessionOrCurrent(1L)).thenReturn(currentSession);
        when(contractService.getContracts(currentSession)).thenReturn(List.of(contract));

        // Act
        List<ContractResponseDto> result = managerService.getContracts(1L);

        // Assert
        assert List.of(contract).equals(result);
    }

    // ---------- Helpers ----------

    private InternshipRequestDto internshipRequestWith(LocalDate startDate, BigDecimal compensationAmount) {
        return new InternshipRequestDto("Développeur backend", "Stage en développement backend", "Java, Spring Boot", 16, "Montréal", WorkMode.HYBRID, startDate, internship.getApplicationDeadline(), compensationAmount, false);
    }
}