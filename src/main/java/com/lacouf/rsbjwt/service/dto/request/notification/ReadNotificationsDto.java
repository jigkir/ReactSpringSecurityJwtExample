package com.lacouf.rsbjwt.service.dto.request.notification;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ReadNotificationsDto(@NotEmpty List<Long> notificationIds) {
}
