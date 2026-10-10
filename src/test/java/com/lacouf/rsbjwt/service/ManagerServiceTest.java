package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.InternshipStatus;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.users.ManagerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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
    private ManagerRepository managerRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private CVRepository cvRepository;
    @Mock
    private InternshipRepository internshipRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Manager> managerArgumentCaptor;

    private CV cv;
    private Internship internship;

    @BeforeEach
    void setUp() {
        Student student = new Student("Marie", "Tremblay", "2234567", Credentials.builder().email("marie@example.com").role(Role.STUDENT).build(), Discipline.COMPUTER_SCIENCE);
        student.setId(2L);
        cv = new CV("pdf".getBytes(), CvVisibility.VISIBLE, CVSharingScope.PUBLIC, CvPriority.MAIN, "cv.pdf", LocalDateTime.of(2026, 9, 1, 10, 0));
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
                employer);

        internship.setId(1L);
    }

    @Test
    void shouldSaveManager() throws UserAlreadyExistsException {
        // Arrange
        when(passwordEncoder.encode("Test123@")).thenReturn("Test123@-encoded");

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
    void shouldThrowUserAlreadyExistsWhenEmailAlreadyUsed() {
        // Arrange
        when(userAppRepository.findByCredentialsEmail("manager@example.com")).thenReturn(Optional.of(new Manager()));

        // Act
        UserAlreadyExistsException exception = assertThrows(
                UserAlreadyExistsException.class,
                () -> managerService.save("First Name", "Last Name", "manager@example.com", "Test123@", "5141234567")
        );

        // Assert
        assert ("email").equals(exception.getField());
        assert ("user already exists").equals(exception.getMessage());

        verify(managerRepository, never()).save(any(Manager.class));
    }

    @Test
    void shouldReturnAllPublicCvs() {
        // Arrange
        when(cvRepository.findBySharingScopeAndVisibility(CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(List.of(cv));

        // Act
        List<ManagerCvResponseDto> result = managerService.getAllPublicCvs();

        // Assert
        assert (Integer.valueOf(1)).equals(result.size());
        assert ("Marie").equals(result.getFirst().student().firstName());
    }

    @Test
    void shouldReturnPublicCv() throws CvNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.getCv(1L);

        // Assert
        assert (Long.valueOf(1L)).equals(result.id());
        assert ("2234567").equals(result.student().studentId());
    }

    @Test
    void shouldThrowCvNotFoundWhenCvIsNotPublicOrDoesNotExist() {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(99L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(CvNotFoundException.class, () -> managerService.getCv(99L));
    }

    @Test
    void shouldReturnCvFile() throws CvNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        CvFileResponseDto result = managerService.getCvFile(1L);

        // Assert
        assert ("cv.pdf").equals(result.fileName());
        assert Arrays.equals("pdf".getBytes(), result.content());
    }

    @Test
    void shouldApproveCv() throws CvNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.approveCv(1L);

        // Assert
        assert (CvStatus.APPROVED).equals(cv.getStatus());
        assert (CvStatus.APPROVED).equals(result.status());
        assert result.rejectionComment() == null;

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldClearRejectionCommentWhenApprovingPreviouslyRejectedCv() throws CvNotFoundException {
        // Arrange
        cv.setStatus(CvStatus.REJECTED);
        cv.setRejectionComment("CV too detailed");
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.approveCv(1L);

        // Assert
        assert (CvStatus.APPROVED).equals(cv.getStatus());
        assert cv.getRejectionComment() == null;
        assert (CvStatus.APPROVED).equals(result.status());
        assert result.rejectionComment() == null;

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldReturnCvWithoutSavingWhenApprovingAlreadyApprovedCv() throws CvNotFoundException {
        // Arrange
        cv.setStatus(CvStatus.APPROVED);
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.approveCv(1L);

        // Assert
        assert (CvStatus.APPROVED).equals(result.status());
        assert (CvStatus.APPROVED).equals(cv.getStatus());

        verify(cvRepository, never()).save(any(CV.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldThrowCvNotFoundWhenApprovingUnknownCv() {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(99L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(CvNotFoundException.class, () -> managerService.approveCv(99L));

        verify(cvRepository, never()).save(any(CV.class));
    }

    @Test
    void shouldRejectCvWithComment() throws Exception {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.rejectCv(1L, "CV too detailed");

        // Assert
        assert (CvStatus.REJECTED).equals(cv.getStatus());
        assert ("CV too detailed").equals(cv.getRejectionComment());
        assert (CvStatus.REJECTED).equals(result.status());
        assert ("CV too detailed").equals(result.rejectionComment());

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCvNotFoundWhenRejectingUnknownCv() {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(99L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(CvNotFoundException.class, () -> managerService.rejectCv(99L, "CV too detailed"));

        verify(cvRepository, never()).save(any(CV.class));
    }

    @Test
    void shouldAllowRejectingPreviouslyApprovedCv() throws Exception {
        // Arrange
        cv.setStatus(CvStatus.APPROVED);
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.rejectCv(1L, "Changed my mind");

        // Assert
        assert (CvStatus.REJECTED).equals(cv.getStatus());
        assert ("Changed my mind").equals(cv.getRejectionComment());
        assert (CvStatus.REJECTED).equals(result.status());

        verify(cvRepository).save(cv);
    }

    @Test
    void shouldAllowRejectingAlreadyRejectedCvWithNewComment() throws Exception {
        // Arrange
        cv.setStatus(CvStatus.REJECTED);
        cv.setRejectionComment("Old comment");
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.rejectCv(1L, "New comment");

        // Assert
        assert (CvStatus.REJECTED).equals(cv.getStatus());
        assert ("New comment").equals(cv.getRejectionComment());
        assert ("New comment").equals(result.rejectionComment());

        verify(cvRepository).save(cv);
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
        assert (InternshipStatus.PENDING).equals(result.status());
    }

    @Test
    void shouldThrowInternshipNotFoundExceptionWhenInternshipDoesNotExist() {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        //Act + assert
        assertThrows(InternshipNotFoundException.class, () -> managerService.getInternshipById(99L));
    }

    @Test
    void shouldApproveInternship() throws InternshipNotFoundException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.approveInternship(1L);

        //Assert
        assert (InternshipStatus.APPROVED).equals(internship.getStatus());
        assert (InternshipStatus.APPROVED).equals(result.status());
        assert internship.getRejectionComment() == null;

        verify(internshipRepository).save(internship);
    }

    @Test
    void shouldRejectInternship() throws InternshipNotFoundException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.rejectInternship(1L, "Ur offer sucks.");

        //Assert
        assert (InternshipStatus.REJECTED).equals(internship.getStatus());
        assert (InternshipStatus.REJECTED).equals(result.status());
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
    void shouldAllowApprovingRejectedInternship() throws InternshipNotFoundException {
        //Arrange
        internship.reject("Offer is no good.");

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.approveInternship(1L);

        // Assert
        assert (InternshipStatus.APPROVED).equals(internship.getStatus());
        assert internship.getRejectionComment() == null;
        assert (InternshipStatus.APPROVED).equals(result.status());
        assert result.rejectionComment() == null;

        verify(internshipRepository).save(internship);
        verify(studentRepository).findByDiscipline(Discipline.COMPUTER_SCIENCE);
    }

    @Test
    void shouldAllowRejectingPreviouslyApprovedInternship() throws InternshipNotFoundException {
        // Arrange
        internship.approve();

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        // Act
        InternshipResponseDto result = managerService.rejectInternship(1L, "Offer does not meet requirements.");

        // Assert
        assert (InternshipStatus.REJECTED).equals(internship.getStatus());
        assert ("Offer does not meet requirements.").equals(internship.getRejectionComment());
        assert (InternshipStatus.REJECTED).equals(result.status());

        verify(internshipRepository).save(internship);
    }

    @Test
    void shouldAllowUpdatingRejectionComment() throws InternshipNotFoundException {
        // Arrange
        internship.reject("Old comment.");

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        // Act
        InternshipResponseDto result = managerService.rejectInternship(1L, "New comment.");

        // Assert
        assert (InternshipStatus.REJECTED).equals(internship.getStatus());
        assert ("New comment.").equals(internship.getRejectionComment());
        assert ("New comment.").equals(result.rejectionComment());

        verify(internshipRepository).save(internship);
    }

    @Test
    void shouldNotifyStudentWhenApprovingCv() throws CvNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        managerService.approveCv(1L);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.CV_APPROVED, "Your CV has been approved.", 1L, cv.getStudent());
    }

    @Test
    void shouldNotifyStudentWithRejectionCommentWhenRejectingCv() throws CvNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        managerService.rejectCv(1L, "CV too detailed");

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.CV_REJECTED, "CV too detailed", 1L, cv.getStudent());
    }

    @Test
    void shouldNotNotifyStudentWhenRejectingWithSameComment() throws CvNotFoundException {
        // Arrange
        cv.setStatus(CvStatus.REJECTED);
        cv.setRejectionComment("CV too detailed");

        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.rejectCv(1L, "CV too detailed");

        // Assert
        assert ("CV too detailed").equals(result.rejectionComment());

        verify(cvRepository, never()).save(any(CV.class));
        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldCloseOldCvNotificationsBeforeNotifyingStudentOfNewDecision() throws CvNotFoundException {
        // Arrange
        cv.setStatus(CvStatus.APPROVED);

        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        managerService.rejectCv(1L, "Changed my mind");

        // Assert
        InOrder inOrder = inOrder(notificationService);
        inOrder.verify(notificationService).closeNotificationsOfTarget(TargetType.CV, 1L);
        inOrder.verify(notificationService).notifyIfAbsent(NotificationType.CV_REJECTED, "Changed my mind", 1L, cv.getStudent());
    }

    @Test
    void shouldNotifyStudentsWithApprovedCvWhenApprovingInternship() throws InternshipNotFoundException {
        // Arrange
        Student student = cv.getStudent();

        cv.setStatus(CvStatus.APPROVED);

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));
        when(studentRepository.findByDiscipline(Discipline.COMPUTER_SCIENCE)).thenReturn(List.of(student));
        when(cvRepository.findByStudent(student)).thenReturn(List.of(cv));

        // Act
        managerService.approveInternship(1L);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.NEW_INTERNSHIP_OFFER, 1L, student);
    }

    @Test
    void shouldNotNotifyStudentsWithoutApprovedCvWhenApprovingInternship() throws InternshipNotFoundException {
        // Arrange
        Student student = cv.getStudent();

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));
        when(studentRepository.findByDiscipline(Discipline.COMPUTER_SCIENCE)).thenReturn(List.of(student));
        when(cvRepository.findByStudent(student)).thenReturn(List.of(cv));

        // Act
        managerService.approveInternship(1L);

        // Assert
        verifyNoInteractions(notificationService);
    }
}