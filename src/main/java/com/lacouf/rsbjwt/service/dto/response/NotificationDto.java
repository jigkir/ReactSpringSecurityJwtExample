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
        UserApp user
) {
}
