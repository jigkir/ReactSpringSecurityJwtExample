package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.CvAlreadyReviewedException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.cv.NotificationNotFoundException;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.cv.CVSharingScope;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.CVRepository;
import com.lacouf.rsbjwt.repository.ManagerRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.response.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;

import java.util.List;
import com.lacouf.rsbjwt.repository.NotificationRepository;


import java.util.Optional;

@Service
public class ManagerService {
    private final ManagerRepository managerRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;
    private final NotificationRepository notificationRepository;
    private final CVRepository cvRepository;

    public ManagerService(ManagerRepository managerRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, NotificationRepository notificationRepository, CVRepository cvRepository) {
        this.managerRepository = managerRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
        this.notificationRepository = notificationRepository;
        this.cvRepository = cvRepository;
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

    public void addNewCVNotificationToManager(String title, String message, Long cvId) throws UserNotFoundException {
        List <Manager> managers = getAllManagers();
        Manager manager = managers.stream().findFirst()
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

    public NotificationDto markNotificationAsRead(long notificationId) throws NotificationNotFoundException {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found with ID: " + notificationId));
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

    public List<ManagerCvResponseDto> getPendingPublicCvs() {
        return cvRepository.findByStatusAndSharingScope(CvStatus.PENDING, CVSharingScope.PUBLIC).stream().map(ManagerCvResponseDto::of).toList();
    }

    public ManagerCvResponseDto getCv(long cvId) throws CvNotFoundException {
        return ManagerCvResponseDto.of(findPublicCv(cvId));
    }

    public CvFileResponseDto getCvFile(long cvId) throws CvNotFoundException {
        return CvFileResponseDto.of(findPublicCv(cvId));
    }

    public ManagerCvResponseDto approveCv(long cvId) throws CvNotFoundException, CvAlreadyReviewedException {
        CV cv = findPendingCv(cvId);

        cv.setStatus(CvStatus.APPROVED);
        addCVApprovalNotificationToStudent(cvId, cv.getStudent());

        return saveAndConvert(cv);
    }

    public ManagerCvResponseDto rejectCv(long cvId, String comment) throws CvNotFoundException, CvAlreadyReviewedException {
        CV cv = findPendingCv(cvId);

        cv.setStatus(CvStatus.REJECTED);
        cv.setRejectionComment(comment);
        addCVRejectionNotificationToStudent(comment, cvId, cv.getStudent());

        return saveAndConvert(cv);
    }

    private CV findPublicCv(long cvId) throws CvNotFoundException {
        return cvRepository.findByIdAndSharingScope(cvId, CVSharingScope.PUBLIC).orElseThrow(() -> new CvNotFoundException("CV with ID " + cvId + " not found."));
    }

    private CV findPendingCv(long cvId) throws CvNotFoundException, CvAlreadyReviewedException {
        CV cv = findPublicCv(cvId);

        verifyCvIsPending(cv);

        return cv;
    }

    private void verifyCvIsPending(CV cv) throws CvAlreadyReviewedException {
        if (cv.getStatus() != CvStatus.PENDING) {
            throw new CvAlreadyReviewedException(cv.getId());
        }
    }

    private ManagerCvResponseDto saveAndConvert(CV cv) {
        cvRepository.save(cv);

        return ManagerCvResponseDto.of(cv);
    }

    private void verifyIfManagerExists(String email) throws UserAlreadyExistsException {
        Optional<UserApp> managerFoundByEmail = userAppRepository.findByCredentialsEmail(email);

        if (managerFoundByEmail.isPresent()) {
            throw new UserAlreadyExistsException("email");
        }
    }

    private List<Manager> getAllManagers() throws UserNotFoundException {
        List<Manager> managers = managerRepository.findAll();

        if (managers.isEmpty()) {
            throw new UserNotFoundException();
        }
        return managers;
    }

    private void addCVRejectionNotificationToStudent(String message, Long cvId, UserApp student) {
        notificationRepository.save(new Notification("CV Rejected", message, NotificationStatus.UNREAD, NotificationType.CV_REJECTED, TargetType.CV, cvId, student));
    }

    private void addCVApprovalNotificationToStudent(Long cvId, UserApp student) {
        notificationRepository.save(new Notification("CV Approved", "Your CV has been approved.", NotificationStatus.UNREAD, NotificationType.CV_APPROVED, TargetType.CV, cvId, student));
    }
}