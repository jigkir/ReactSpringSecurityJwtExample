package com.lacouf.rsbjwt.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Entity
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column
    String message;

    @Enumerated (EnumType.STRING)
    @Column
    NotificationStatus status;

    @ManyToOne
    @JoinColumn(name = "user_id")
    UserApp user;

    public Notification() {
    }

    public Notification(String message, NotificationStatus status, UserApp user) {
        this.message = message;
        this.status = status;
        this.user = user;
    }
}
