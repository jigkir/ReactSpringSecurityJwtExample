package com.lacouf.rsbjwt.service.notification;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.notification.NotificationRepository;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<NotificationDto> getUnreadNotifications(String email) {
        return notificationRepository.findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc(email, NotificationStatus.UNREAD)
                .stream()
                .map(NotificationDto::of)
                .toList();
    }

    public void markAsRead(String email, List<Long> notificationIds) {
        notificationRepository.markAsReadByEmailAndIdIn(email, notificationIds);
    }

    public void notifyIfAbsent(NotificationType notificationType, long targetId, UserApp recipient) {
        notifyIfAbsent(notificationType, notificationType.getMessage(), targetId, recipient);
    }

    public void notifyIfAbsent(NotificationType notificationType, String message, long targetId, UserApp recipient) {
        boolean alreadyNotified = notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                notificationType, targetId, recipient, NotificationStatus.UNREAD);

        if (!alreadyNotified) {
            notificationRepository.save(new Notification(notificationType, message, targetId, recipient));
        }
    }

    public void notifyInternshipOffered(InternshipApplication application) {
        NotificationType type = NotificationType.INTERNSHIP_OFFERED;
        Student student = application.getStudent();

        boolean alreadyNotified = notificationRepository.existsByNotificationTypeAndTargetIdAndUserAndStatus(
                type, application.getId(), student, NotificationStatus.UNREAD);

        if (alreadyNotified) {
            return;
        }

        Internship internship = application.getInternship();
        String companyName = internship.getPostedBy().getCompanyName();
        String internshipTitle = internship.getTitle();
        String message = String.format(type.getMessage(), companyName, internshipTitle);

        notificationRepository.save(
                new Notification(type, message, application.getId(), student, companyName, internshipTitle));
    }

    public void closeNotificationsOfTarget(TargetType targetType, long targetId) {
        notificationRepository.markAllAsReadByTargetTypeAndTargetId(targetType, targetId);
    }

    public void closeNotificationsOfType(NotificationType notificationType, long targetId) {
        notificationRepository.markAllAsReadByNotificationTypeAndTargetId(notificationType, targetId);
    }

    public void closeNotificationOfRecipient(NotificationType notificationType, long targetId, UserApp recipient) {
        notificationRepository.markAsReadByUserAndNotificationTypeAndTargetId(recipient, notificationType, targetId);
    }
}
