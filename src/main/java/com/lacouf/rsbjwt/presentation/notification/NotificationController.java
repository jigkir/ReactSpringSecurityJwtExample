package com.lacouf.rsbjwt.presentation.notification;

import com.lacouf.rsbjwt.service.dto.request.notification.ReadNotificationsDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(authentication.getName()));
    }

    @PutMapping("/read")
    public ResponseEntity<Void> markAsRead(@Valid @RequestBody ReadNotificationsDto readNotificationsDto, Authentication authentication) {
        notificationService.markAsRead(authentication.getName(), readNotificationsDto.notificationIds());
        return ResponseEntity.noContent().build();
    }
}
