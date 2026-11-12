package com.lacouf.rsbjwt.service.notification;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.notification.NotificationRepository;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
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

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    private static final String EMAIL = "student@example.com";

    @InjectMocks
    private NotificationService notificationService;

    @Mock
    private NotificationRepository notificationRepository;

    @Captor
    private ArgumentCaptor<Notification> notificationCaptor;

    private final Student student = new Student();

    @Test
    void shouldReturnUnreadNotificationsOfConnectedUser() {
        // Arrange
        Notification notification = new Notification(NotificationType.CV_APPROVED, "Your CV has been approved.", 1L, student);
        ReflectionTestUtils.setField(notification, "id", 5L);

        when(notificationRepository.findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc(EMAIL, NotificationStatus.UNREAD))
                .thenReturn(List.of(notification));

        // Act
        List<NotificationDto> result = notificationService.getUnreadNotifications(EMAIL);

        // Assert
        assert (Integer.valueOf(1)).equals(result.size());
        assert (NotificationType.CV_APPROVED).equals(result.getFirst().notificationType());
    }

    @Test
    void shouldCreateNotificationWithDefaultMessageWhenNoUnreadExists() {
        // Arrange
        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                NotificationType.CV_APPROVED, 1L, student, NotificationStatus.UNREAD)).thenReturn(false);

        // Act
        notificationService.notifyIfAbsent(NotificationType.CV_APPROVED, 1L, student);

        // Assert
        verify(notificationRepository).save(notificationCaptor.capture());

        Notification saved = notificationCaptor.getValue();

        assert ("CV Approved").equals(saved.getTitle());
        assert ("Your CV has been approved.").equals(saved.getMessage());
        assert (NotificationStatus.UNREAD).equals(saved.getStatus());
        assert (TargetType.CV).equals(saved.getTargetType());
    }

    @Test
    void shouldCreateInterviewConvocationNotificationTargetingTheInterview() {
        // Arrange
        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                NotificationType.INTERVIEW_CONVOCATION, 30L, student, NotificationStatus.UNREAD)).thenReturn(false);

        // Act
        notificationService.notifyIfAbsent(NotificationType.INTERVIEW_CONVOCATION, 30L, student);

        // Assert
        verify(notificationRepository).save(notificationCaptor.capture());

        Notification saved = notificationCaptor.getValue();

        assert ("Interview Invitation").equals(saved.getTitle());
        assert ("You have been invited to an interview.").equals(saved.getMessage());
        assert (NotificationStatus.UNREAD).equals(saved.getStatus());
        assert (TargetType.INTERVIEW).equals(saved.getTargetType());
        assert (Long.valueOf(30L)).equals(saved.getTargetId());
        assert student.equals(saved.getUser());
    }

    @Test
    void shouldNotCreateNotificationWhenUnreadAlreadyExists() {
        // Arrange
        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                NotificationType.NEW_INTERNSHIP_OFFER, 1L, student, NotificationStatus.UNREAD)).thenReturn(true);

        // Act
        notificationService.notifyIfAbsent(NotificationType.NEW_INTERNSHIP_OFFER, 1L, student);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void shouldNotCreateInterviewConvocationNotificationAgainWhenUnreadAlreadyExists() {
        // Arrange
        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                NotificationType.INTERVIEW_CONVOCATION, 30L, student, NotificationStatus.UNREAD)).thenReturn(true);

        // Act
        notificationService.notifyIfAbsent(NotificationType.INTERVIEW_CONVOCATION, 30L, student);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void shouldMarkChosenNotificationsAsReadForConnectedUser() {
        // Act
        notificationService.markAsRead(EMAIL, List.of(1L, 2L));

        // Assert
        verify(notificationRepository).markAsReadByEmailAndIdIn(EMAIL, List.of(1L, 2L));
    }

    @Test
    void shouldCloseNotificationsOfTargetWhenTargetChanges() {
        // Act
        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, 1L);

        // Assert
        verify(notificationRepository).markAllAsReadByTargetTypeAndTargetId(TargetType.INTERNSHIP_OFFER, 1L);
    }

    @Test
    void shouldCloseOnlyNotificationsOfTypeWhenClosingByType() {
        // Act
        notificationService.closeNotificationsOfType(NotificationType.NEW_INTERNSHIP_APPLICATION, 1L);

        // Assert
        verify(notificationRepository).markAllAsReadByNotificationTypeAndTargetId(NotificationType.NEW_INTERNSHIP_APPLICATION, 1L);
    }

    @Test
    void shouldCloseOnlyNotificationOfRecipientWhenClosingForRecipient() {
        // Act
        notificationService.closeNotificationOfRecipient(NotificationType.NEW_INTERNSHIP_OFFER, 1L, student);

        // Assert
        verify(notificationRepository).markAsReadByUserAndNotificationTypeAndTargetId(student, NotificationType.NEW_INTERNSHIP_OFFER, 1L);
    }

    // ==========================================
    // Internship Offered Notification Tests
    // ==========================================

    @Test
    void shouldCreateInternshipOfferedNotificationWithCompanyAndTitle() {
        // Arrange
        InternshipApplication application = offeredApplication();

        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                NotificationType.INTERNSHIP_OFFERED, 20L, student, NotificationStatus.UNREAD)).thenReturn(false);

        // Act
        notificationService.notifyInternshipOffered(application);

        // Assert
        verify(notificationRepository).save(notificationCaptor.capture());

        Notification saved = notificationCaptor.getValue();

        assert ("Internship Offer Received").equals(saved.getTitle());
        assert ("Company Name has offered you the internship \"Software Developer\".").equals(saved.getMessage());
        assert (NotificationType.INTERNSHIP_OFFERED).equals(saved.getNotificationType());
        assert (NotificationStatus.UNREAD).equals(saved.getStatus());
        assert (TargetType.INTERNSHIP_APPLICATION).equals(saved.getTargetType());
        assert ("Company Name").equals(saved.getCompanyName());
        assert ("Software Developer").equals(saved.getInternshipTitle());
    }

    @Test
    void shouldTargetTheApplicationAndNotifyOnlyTheConcernedStudentWhenInternshipIsOffered() {
        // Arrange
        InternshipApplication application = offeredApplication();

        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                NotificationType.INTERNSHIP_OFFERED, 20L, student, NotificationStatus.UNREAD)).thenReturn(false);

        // Act
        notificationService.notifyInternshipOffered(application);

        // Assert
        verify(notificationRepository).save(notificationCaptor.capture());

        Notification saved = notificationCaptor.getValue();

        assert (Long.valueOf(20L)).equals(saved.getTargetId());
        assert student.equals(saved.getUser());
    }

    @Test
    void shouldNotCreateInternshipOfferedNotificationAgainWhenUnreadAlreadyExists() {
        // Arrange
        InternshipApplication application = offeredApplication();

        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                NotificationType.INTERNSHIP_OFFERED, 20L, student, NotificationStatus.UNREAD)).thenReturn(true);

        // Act
        notificationService.notifyInternshipOffered(application);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void shouldReturnCompanyAndInternshipTitleWhenGettingUnreadInternshipOfferedNotification() {
        // Arrange
        Notification notification = new Notification(NotificationType.INTERNSHIP_OFFERED, "message", 20L, student, "Company Name", "Software Developer");
        ReflectionTestUtils.setField(notification, "id", 7L);

        when(notificationRepository.findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc(EMAIL, NotificationStatus.UNREAD))
                .thenReturn(List.of(notification));

        // Act
        List<NotificationDto> result = notificationService.getUnreadNotifications(EMAIL);

        // Assert
        assert (Integer.valueOf(1)).equals(result.size());
        assert (NotificationType.INTERNSHIP_OFFERED).equals(result.getFirst().notificationType());
        assert ("Company Name").equals(result.getFirst().companyName());
        assert ("Software Developer").equals(result.getFirst().internshipTitle());
    }

    @Test
    void shouldLeaveCompanyAndInternshipTitleEmptyForOtherNotifications() {
        // Arrange
        Notification notification = new Notification(NotificationType.CV_APPROVED, "Your CV has been approved.", 1L, student);
        ReflectionTestUtils.setField(notification, "id", 8L);

        when(notificationRepository.findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc(EMAIL, NotificationStatus.UNREAD))
                .thenReturn(List.of(notification));

        // Act
        List<NotificationDto> result = notificationService.getUnreadNotifications(EMAIL);

        // Assert
        assert result.getFirst().companyName() == null;
        assert result.getFirst().internshipTitle() == null;
    }

    // ---------- Helpers ----------

    private InternshipApplication offeredApplication() {
        Employer employer = new Employer("First Name", "Last Name",
                Credentials.builder().email("employer@example.com").password("pw").role(Role.EMPLOYER).build(),
                "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");
        employer.setId(1L);

        AcademicSession session = new AcademicSession(Season.WINTER, 2027);
        session.setId(1L);

        Internship internship = new Internship("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID,
                LocalDate.now().plusMonths(4), LocalDate.now().plusMonths(2), new BigDecimal("25.00"), false, employer, session);
        internship.setId(10L);

        InternshipApplication application = new InternshipApplication(internship, new CV(), student);
        application.setId(20L);

        return application;
    }
}