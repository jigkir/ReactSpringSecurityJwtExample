package com.lacouf.rsbjwt.service.dto.response;

import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.UserApp;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String title,
        String message,
        NotificationStatus status,
        TargetType targetType,
        NotificationType notificationType,
        Long targetId,
        LocalDateTime createdAt,
        long userId
) {

    public static NotificationDto of(com.lacouf.rsbjwt.model.notification.Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getStatus(),
                notification.getTargetType(),
                notification.getType(),
                notification.getTargetId(),
                notification.getCreatedAt(),
                notification.getUser().getId()
        );
    }
}
