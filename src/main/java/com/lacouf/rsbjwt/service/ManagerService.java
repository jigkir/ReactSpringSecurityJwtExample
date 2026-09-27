package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.ManagerRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.response.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.service.dto.response.NotificationDto;
import java.util.List;
import com.lacouf.rsbjwt.repository.NotificationRepository;


import java.util.Optional;

@Service
public class ManagerService {
    private final ManagerRepository managerRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;
    private final NotificationRepository notificationRepository;

    public ManagerService(ManagerRepository managerRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, NotificationRepository notificationRepository) {
        this.managerRepository = managerRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
        this.notificationRepository = notificationRepository;
    }

    public UserResponseDto save(String firstName, String lastName, String email, String password, String phoneNumber) throws UserAlreadyExistsException {
        verifyIfManagerExists(email);

        Credentials credentials = Credentials.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(Role.MANAGER)
                .build();

        String formattedPhoneNumber = phoneNumber.replaceFirst("^([0-9]{3})([0-9]{3})([0-9]{4})$", "$1-$2-$3");

        Manager manager = new Manager(firstName, lastName, credentials, formattedPhoneNumber);

        managerRepository.save(manager);

        return UserResponseDto.of(manager);
    }

    public void addNewCVNotificationToManager(Long managerId, String title, String message, Long cvId) throws UserNotFoundException {
        Manager manager = managerRepository.findById(managerId)
                .orElseThrow(UserNotFoundException::new);
        notificationRepository.save(new Notification(title, message, NotificationStatus.UNREAD, NotificationType.CV_SUBMITTED_FOR_REVIEW, TargetType.CV, cvId, manager));
    }

    public List<NotificationDto> getNotificationsForManager(long managerId) throws UserNotFoundException {
        Manager manager = managerRepository.findById(managerId)
                .orElseThrow(UserNotFoundException::new);
        return notificationRepository.findByUserId(manager.getId()).stream()
                .map(notification -> new NotificationDto(
                        notification.getId(),
                        notification.getTitle(),
                        notification.getMessage(),
                        notification.getStatus(),
                        notification.getTargetType(),
                        notification.getType(),
                        notification.getTargetId(),
                        notification.getCreatedAt(),
                        notification.getUser()
                ))
                .toList();
    }

    public NotificationDto markNotificationAsRead(long notificationId) throws UserNotFoundException {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(UserNotFoundException::new);
        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getStatus(),
                notification.getTargetType(),
                notification.getType(),
                notification.getTargetId(),
                notification.getCreatedAt(),
                notification.getUser()
        );
    }

    private void verifyIfManagerExists(String email) throws UserAlreadyExistsException {
        Optional<UserApp> managerFoundByEmail = userAppRepository.findByCredentialsEmail(email);

        if (managerFoundByEmail.isPresent()) {
            throw new UserAlreadyExistsException("email");
        }
    }
}