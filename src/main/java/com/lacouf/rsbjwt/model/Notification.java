package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    private TargetType targetType;

    private Long targetId; // genre CV ID ou wtv

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserApp user;

    public Notification(String title, String message, NotificationStatus status, NotificationType type, TargetType targetType, Long targetId, UserApp user) {
        this.title = title;
        this.message = message;
        this.status = status;
        this.type = type;
        this.targetType = targetType;
        this.targetId = targetId;
        this.user = user;
    }

    public void markAsRead() {
        this.status = NotificationStatus.READ;
    }

}