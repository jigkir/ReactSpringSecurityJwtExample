package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.UserApp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    boolean existsByNotificationTypeAndTargetIdAndUser(NotificationType notificationType, Long targetId, UserApp user);

    List<Notification> findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc(String email, NotificationStatus status);

    Optional<Notification> findByIdAndUser_Credentials_Email(long id, String email);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.status = com.lacouf.rsbjwt.model.notification.NotificationStatus.READ WHERE n.user.credentials.email = :email AND n.notificationType = :notificationType AND n.status = com.lacouf.rsbjwt.model.notification.NotificationStatus.UNREAD")
    void markAllAsReadByEmailAndNotificationType(@Param("email") String email, @Param("notificationType") NotificationType notificationType);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.status = com.lacouf.rsbjwt.model.notification.NotificationStatus.READ WHERE n.targetType = :targetType AND n.targetId = :targetId AND n.status = com.lacouf.rsbjwt.model.notification.NotificationStatus.UNREAD")
    void markAllAsReadByTargetTypeAndTargetId(@Param("targetType") TargetType targetType, @Param("targetId") long targetId);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.status = com.lacouf.rsbjwt.model.notification.NotificationStatus.READ WHERE n.user.credentials.email = :email AND n.targetType = :targetType AND n.status = com.lacouf.rsbjwt.model.notification.NotificationStatus.UNREAD")
    void markAllAsReadByEmailAndTargetType(@Param("email") String email, @Param("targetType") TargetType targetType);
}
