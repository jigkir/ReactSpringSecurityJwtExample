package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.notification.NotificationNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.cv.CVSharingScope;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.InternshipStatus;
import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ManagerService {
    private final ManagerRepository managerRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;
    private final NotificationRepository notificationRepository;
    private final CVRepository cvRepository;
    private final InternshipRepository internshipRepository;
    private final StudentService studentService;

    private static final String CV_APPROVED_TITLE = "CV Approved";
    private static final String CV_APPROVED_MESSAGE = "Your CV has been approved.";
    private static final String CV_REJECTED_TITLE = "CV Rejected";

    public ManagerService(ManagerRepository managerRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, NotificationRepository notificationRepository, CVRepository cvRepository, InternshipRepository internshipRepository, StudentService studentService) {
        this.managerRepository = managerRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
        this.notificationRepository = notificationRepository;
        this.cvRepository = cvRepository;
        this.internshipRepository = internshipRepository;
        this.studentService = studentService;
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

    public List<NotificationDto> getNotificationsForManager(String email) throws UserNotFoundException {
        return notificationRepository.findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc(email, NotificationStatus.UNREAD)
                .stream()
                .map(NotificationDto::of)
                .toList();
    }

    public NotificationDto markNotificationAsRead(long notificationId, String email) throws NotificationNotFoundException {
        Notification notification = notificationRepository.findByIdAndUser_Credentials_Email(notificationId, email).orElseThrow(() -> new NotificationNotFoundException(notificationId));
        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
        return NotificationDto.of(notification);
    }

    public List<ManagerCvResponseDto> getAllPublicCvs() {
        List<CV> cvs = cvRepository.findBySharingScopeAndVisibility(CVSharingScope.PUBLIC, CvVisibility.VISIBLE);

        return cvs.stream().map(ManagerCvResponseDto::of).toList();
    }

    public ManagerCvResponseDto getCv(long cvId) throws CvNotFoundException {
        return ManagerCvResponseDto.of(findPublicCv(cvId));
    }

    public CvFileResponseDto getCvFile(long cvId) throws CvNotFoundException {
        return CvFileResponseDto.of(findPublicCv(cvId));
    }

    @Transactional
    public ManagerCvResponseDto approveCv(long cvId) throws CvNotFoundException {
        CV cv = findPublicCv(cvId);

        if (cv.getStatus() == CvStatus.APPROVED) {
            return ManagerCvResponseDto.of(cv);
        }
        cv.setStatus(CvStatus.APPROVED);
        cv.setRejectionComment(null);

        notifyStudentOfCvReviewDecision(cv, NotificationType.CV_APPROVED, CV_APPROVED_TITLE, CV_APPROVED_MESSAGE);

        return saveAndConvert(cv);
    }

    @Transactional
    public ManagerCvResponseDto rejectCv(long cvId, String comment) throws CvNotFoundException {
        CV cv = findPublicCv(cvId);

        if (cv.getStatus() == CvStatus.REJECTED && comment.equals(cv.getRejectionComment())) {
            return ManagerCvResponseDto.of(cv);
        }

        cv.setStatus(CvStatus.REJECTED);
        cv.setRejectionComment(comment);

        notifyStudentOfCvReviewDecision(cv, NotificationType.CV_REJECTED, CV_REJECTED_TITLE, comment);

        return saveAndConvert(cv);
    }

    public List<InternshipResponseDto> getPendingInternships() {
        return internshipRepository.findByStatusAndDeletedFalse(InternshipStatus.PENDING).stream().map(InternshipResponseDto::of).toList();
    }

    public List<InternshipResponseDto> getAllInternships() {
        return internshipRepository.findByDeletedFalse().stream().map(InternshipResponseDto::of).toList();
    }

    public InternshipResponseDto getInternshipById(long internshipId) throws InternshipNotFoundException {
        return InternshipResponseDto.of(findInternship(internshipId));
    }

    @Transactional
    public InternshipResponseDto approveInternship(long internshipId) throws InternshipNotFoundException {
        Internship internship = findInternship(internshipId);

        if (internship.getStatus() == InternshipStatus.APPROVED) {
            return InternshipResponseDto.of(internship);
        }

        internship.approve();
        internshipRepository.save(internship);

        studentService.createNewInternshipNotificationsForStudents(internship);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto rejectInternship(long internshipId, String comment) throws InternshipNotFoundException {
        Internship internship = findInternship(internshipId);

        internship.reject(comment);
        internshipRepository.save(internship);

        return InternshipResponseDto.of(internship);
    }

    private Internship findInternship(long internshipId) throws InternshipNotFoundException {
        return internshipRepository.findByIdAndDeletedFalse(internshipId).orElseThrow(() -> new InternshipNotFoundException(internshipId));
    }

    private CV findPublicCv(long cvId) throws CvNotFoundException {
        return cvRepository.findByIdAndSharingScopeAndVisibility(cvId, CVSharingScope.PUBLIC, CvVisibility.VISIBLE).orElseThrow(() -> new CvNotFoundException("CV with ID " + cvId + " not found."));
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

    private void notifyStudentOfCvReviewDecision(CV cv, NotificationType type, String title, String message) {
        notificationRepository.markAllAsReadByTargetTypeAndTargetId(TargetType.CV, cv.getId());

        notificationRepository.save(new Notification(title, message, type, cv.getId(), cv.getStudent()));
    }
}