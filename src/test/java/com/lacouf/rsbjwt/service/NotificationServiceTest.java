package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.notification.NotificationRepository;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

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
    void shouldReturnUnreadCountWhenCountingByType() {
        // Arrange
        when(notificationRepository.countByUser_Credentials_EmailAndStatusAndNotificationType(
                EMAIL, NotificationStatus.UNREAD, NotificationType.NEW_INTERNSHIP_OFFER)).thenReturn(3L);

        // Act
        long result = notificationService.countUnread(EMAIL, NotificationType.NEW_INTERNSHIP_OFFER);

        // Assert
        assert (Long.valueOf(3L)).equals(result);
    }

    @Test
    void shouldMarkAllNotificationsOfTargetTypeAsReadForConnectedUser() {
        // Act
        notificationService.markAllAsReadByTargetType(EMAIL, TargetType.CV);

        // Assert
        verify(notificationRepository).markAllAsReadByEmailAndTargetType(EMAIL, TargetType.CV);
    }

    @Test
    void shouldCloseNotificationsOfTargetWhenTargetChanges() {
        // Act
        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, 1L);

        // Assert
        verify(notificationRepository).markAllAsReadByTargetTypeAndTargetId(TargetType.INTERNSHIP_OFFER, 1L);
    }
}
