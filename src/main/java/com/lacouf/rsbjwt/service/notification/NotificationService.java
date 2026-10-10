package com.lacouf.rsbjwt.service.notification;

import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
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

    public long countUnread(String email, NotificationType notificationType) {
        return notificationRepository.countByUser_Credentials_EmailAndStatusAndNotificationType(email, NotificationStatus.UNREAD, notificationType);
    }

    public void markAllAsReadByTargetType(String email, TargetType targetType) {
        notificationRepository.markAllAsReadByEmailAndTargetType(email, targetType);
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

    public void closeNotificationsOfTarget(TargetType targetType, long targetId) {
        notificationRepository.markAllAsReadByTargetTypeAndTargetId(targetType, targetId);
    }
}
