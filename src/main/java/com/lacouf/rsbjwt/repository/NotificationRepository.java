package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);

    boolean existsByTypeAndTargetIdAndUser(NotificationType type, Long targetId, UserApp user);
}
