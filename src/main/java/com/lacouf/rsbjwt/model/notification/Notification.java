package com.lacouf.rsbjwt.model.notification;

import com.lacouf.rsbjwt.model.user.UserApp;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    private TargetType targetType;

    private Long targetId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserApp user;

    public Notification(NotificationType notificationType, String message, Long targetId, UserApp user) {
        this.title = notificationType.getTitle();
        this.message = message;
        this.status = NotificationStatus.UNREAD;
        this.notificationType = notificationType;
        this.targetType = notificationType.getTargetType();
        this.targetId = targetId;
        this.user = user;
        this.createdAt = LocalDateTime.now();
    }
}