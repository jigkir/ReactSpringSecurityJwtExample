package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Notification;
import com.lacouf.rsbjwt.model.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);
}
