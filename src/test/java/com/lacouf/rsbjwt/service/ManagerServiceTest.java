package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.CvAlreadyReviewedException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipAlreadyReviewedException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.notification.NotificationNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.InternshipStatus;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.service.dto.response.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.NotificationDto;
import org.junit.jupiter.api.BeforeEach;
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
    private ManagerRepository managerRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private CVRepository cvRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private InternshipRepository internshipRepository;

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
                InternshipStatus.PENDING,
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
        assert(savedManager.getFirstName()).equals("First Name");
        assert(savedManager.getLastName()).equals("Last Name");
        assert(savedManager.getEmail()).equals("manager@example.com");
        assert(savedManager.getPassword()).equals("Test123@-encoded");
        assert(savedManager.getRole()).equals(Role.MANAGER);
        assert(savedManager.getPhoneNumber()).equals("514-123-4567");
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
        assert("email").equals(exception.getField());
        assert("user already exists").equals(exception.getMessage());

        verify(managerRepository, never()).save(any(Manager.class));
    }

    @Test
    void shouldReturnAllPublicCvs() {
        // Arrange
        when(cvRepository.findBySharingScopeAndVisibility(CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(List.of(cv));

        // Act
        List<ManagerCvResponseDto> result = managerService.getAllPublicCvs();

        // Assert
        assert(Integer.valueOf(1)).equals(result.size());
        assert("Marie").equals(result.getFirst().student().firstName());
    }

    @Test
    void shouldReturnPublicCv() throws CvNotFoundException {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.getCv(1L);

        // Assert
        assert(Long.valueOf(1L)).equals(result.id());
        assert("2234567").equals(result.student().studentId());
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
        assert("cv.pdf").equals(result.fileName());
        assert Arrays.equals("pdf".getBytes(), result.content());
    }

    @Test
    void shouldApproveCv() throws CvNotFoundException, CvAlreadyReviewedException {
        // Arrange
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.approveCv(1L);

        // Assert
        assert(CvStatus.APPROVED).equals(cv.getStatus());
        assert (CvStatus.APPROVED).equals(result.status());
        assert result.rejectionComment() == null;

        verify(cvRepository).save(cv);
        verify(notificationRepository).save(any(Notification.class));
        verify(notificationRepository).markAllAsReadByTypeAndTargetId(NotificationType.CV_SUBMITTED_FOR_REVIEW, 1L);
    }

    @Test
    void shouldClearRejectionCommentWhenApprovingPreviouslyRejectedCv() throws CvNotFoundException, CvAlreadyReviewedException {
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
    void shouldReturnCvWithoutSavingWhenApprovingAlreadyApprovedCv() throws CvNotFoundException, CvAlreadyReviewedException {
        // Arrange
        cv.setStatus(CvStatus.APPROVED);
        when(cvRepository.findByIdAndSharingScopeAndVisibility(1L, CVSharingScope.PUBLIC, CvVisibility.VISIBLE)).thenReturn(Optional.of(cv));

        // Act
        ManagerCvResponseDto result = managerService.approveCv(1L);

        // Assert
        assert (CvStatus.APPROVED).equals(result.status());
        assert (CvStatus.APPROVED).equals(cv.getStatus());

        verify(cvRepository, never()).save(any(CV.class));
        verifyNoInteractions(notificationRepository);
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
        assert(CvStatus.REJECTED).equals(cv.getStatus());
        assert("CV too detailed").equals(cv.getRejectionComment());
        assert(CvStatus.REJECTED).equals(result.status());
        assert("CV too detailed").equals(result.rejectionComment());

        verify(cvRepository).save(cv);
        verify(notificationRepository).save(any(Notification.class));
        verify(notificationRepository).markAllAsReadByTypeAndTargetId(NotificationType.CV_SUBMITTED_FOR_REVIEW, 1L);
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

    //recup un stage par ID
    @Test
    void shouldReturnInternshipById() throws InternshipNotFoundException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.getInternshipById(1L);

        //Assert
        assert(Long.valueOf(1L)).equals(result.id());
        assert("Développeur logiciel").equals(result.title());
        assert(InternshipStatus.PENDING).equals(result.status());
    }

    //stage inexistant
    @Test
    void shouldThrowInternshipNotFoundExceptionWhenInternshipDoesNotExist() {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        //Act + assert
        assertThrows(InternshipNotFoundException.class, () -> managerService.getInternshipById(99L));
    }

    //accepter un stage
    @Test
    void shouldApproveInternship() throws InternshipNotFoundException, InternshipAlreadyReviewedException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.approveInternship(1L);

        //Assert
        assert(InternshipStatus.APPROVED).equals(internship.getStatus());
        assert(InternshipStatus.APPROVED).equals(result.status());
        assert internship.getRejectionComment() == null;

        verify(internshipRepository).save(internship);
    }

    //refuser un stage
    @Test
    void shouldRejectInternship() throws InternshipNotFoundException, InternshipAlreadyReviewedException {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        //Act
        InternshipResponseDto result = managerService.rejectInternship(1L, "Ur offer sucks.");

        //Assert
        assert(InternshipStatus.REJECTED).equals(internship.getStatus());
        assert(InternshipStatus.REJECTED).equals(result.status());
        assert("Ur offer sucks.").equals(internship.getRejectionComment());
        assert("Ur offer sucks.").equals(result.rejectionComment());

        verify(internshipRepository).save(internship);
    }

    //approve inexistant internship
    @Test
    void shouldThrowInternshipNotFoundWhenApprovingUnknownInternship() {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        //Act + assert
        assertThrows(InternshipNotFoundException.class, () -> managerService.approveInternship(99L));

        verify(internshipRepository, never()).save(any(Internship.class));
    }

    //reject inexistant internship
    @Test
    void shouldThrowInternshipNotFoundWhenRejectingUnknownInternship() {
        //Arrange
        when(internshipRepository.findByIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        //Act + assert
        assertThrows(InternshipNotFoundException.class, () -> managerService.rejectInternship(99L, "Who's there?"));

        verify(internshipRepository, never()).save(any(Internship.class));
    }

    @Test
    void shouldReturnOnlyUnreadNotificationsOfConnectedManager() throws Exception {
        // Arrange
        Notification notification = new Notification("New CV Pending Review", "A new CV has been submitted for review.", NotificationStatus.UNREAD, NotificationType.CV_SUBMITTED_FOR_REVIEW, TargetType.CV, 1L, new Manager());
        notification.setId(5L);

        when(notificationRepository.findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc("manager@example.com", NotificationStatus.UNREAD)).thenReturn(List.of(notification));

        // Act
        List<NotificationDto> result = managerService.getNotificationsForManager("manager@example.com");

        // Assert
        assert(Integer.valueOf(1)).equals(result.size());
        assert(Long.valueOf(5L)).equals(result.getFirst().id());
        assert(NotificationStatus.UNREAD).equals(result.getFirst().status());
        assert(NotificationType.CV_SUBMITTED_FOR_REVIEW).equals(result.getFirst().notificationType());
    }

    @Test
    void shouldMarkNotificationAsRead() throws NotificationNotFoundException {
        // Arrange
        Notification notification = new Notification("New CV Pending Review", "A new CV has been submitted for review.", NotificationStatus.UNREAD, NotificationType.CV_SUBMITTED_FOR_REVIEW, TargetType.CV, 1L, new Manager());
        notification.setId(5L);

        when(notificationRepository.findByIdAndUser_Credentials_Email(5L, "manager@example.com")).thenReturn(Optional.of(notification));

        // Act
        NotificationDto result = managerService.markNotificationAsRead(5L, "manager@example.com");

        // Assert
        assert(NotificationStatus.READ).equals(notification.getStatus());
        assert(NotificationStatus.READ).equals(result.status());

        verify(notificationRepository).save(notification);
    }

    @Test
    void shouldThrowWhenApprovingAlreadyApprovedInternship() {
        // Arrange
        internship.approve();

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        // Act
        InternshipAlreadyReviewedException exception = assertThrows(InternshipAlreadyReviewedException.class, () -> managerService.approveInternship(1L));

        // Assert
        assert("Internship with id: 1 was already reviewed.").equals(exception.getMessage());

        verify(internshipRepository, never()).save(any(Internship.class));
    }

    @Test
    void shouldThrowInternshipAlreadyReviewedWhenRejectingAlreadyRejectedInternship() {
        // Arrange
        internship.reject("Previous rejection.");

        when(internshipRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(internship));

        // Act + Assert
        assertThrows(InternshipAlreadyReviewedException.class, () -> managerService.rejectInternship(1L, "New rejection."));

        verify(internshipRepository, never()).save(any(Internship.class));
    }
}