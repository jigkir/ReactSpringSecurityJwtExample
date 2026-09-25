package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.NotificationStatus;
import com.lacouf.rsbjwt.model.NotificationType;
import com.lacouf.rsbjwt.model.TargetType;
import com.lacouf.rsbjwt.model.UserApp;

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
