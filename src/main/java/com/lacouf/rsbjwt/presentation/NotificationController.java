package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.service.NotificationService;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
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

    @GetMapping("/unread/count/{notificationType}")
    public ResponseEntity<Long> countUnread(@PathVariable NotificationType notificationType, Authentication authentication) {
        return ResponseEntity.ok(notificationService.countUnread(authentication.getName(), notificationType));
    }

    @PutMapping("/read/{targetType}")
    public ResponseEntity<Void> markAllAsReadByTargetType(@PathVariable TargetType targetType, Authentication authentication) {
        notificationService.markAllAsReadByTargetType(authentication.getName(), targetType);
        return ResponseEntity.noContent().build();
    }
}
