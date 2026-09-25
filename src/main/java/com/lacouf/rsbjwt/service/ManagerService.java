package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.ManagerRepository;
import com.lacouf.rsbjwt.repository.NotificationRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.NotificationDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
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

    public void verifyIfManagerExists(String email) throws UserAlreadyExistsException {
        Optional<UserApp> managerFoundByEmail = userAppRepository.findByCredentialsEmail(email);

        if (managerFoundByEmail.isPresent()) {
            throw new UserAlreadyExistsException("email");
        }
    }

    public void addNewCVNotificationToManager(Long managerId, String title, String message) throws UserNotFoundException {
        Optional<Manager> managerOptional = managerRepository.findById(managerId);
        if (managerOptional.isPresent()) {
            Manager manager = managerOptional.get();
            notificationRepository.save(new Notification(title, message, NotificationStatus.UNREAD, NotificationType.CV_SUBMITTED_FOR_REVIEW, TargetType.CV, managerId, manager));
        } else {
            throw new UserNotFoundException();
        }
    }

    public List<NotificationDto> getNotificationsForManager(Long managerId) throws UserNotFoundException {
        Optional<Manager> managerOptional = managerRepository.findById(managerId);
        if (managerOptional.isPresent()) {
            Manager manager = managerOptional.get();
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
        } else {
            throw new UserNotFoundException();
        }
    }
}
