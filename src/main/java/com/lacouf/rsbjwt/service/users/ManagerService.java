package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.InternshipStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
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
    private final CVRepository cvRepository;
    private final InternshipRepository internshipRepository;
    private final StudentRepository studentRepository;
    private final NotificationService notificationService;

    public ManagerService(ManagerRepository managerRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, CVRepository cvRepository, InternshipRepository internshipRepository, StudentRepository studentRepository, NotificationService notificationService) {
        this.managerRepository = managerRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
        this.cvRepository = cvRepository;
        this.internshipRepository = internshipRepository;
        this.studentRepository = studentRepository;
        this.notificationService = notificationService;
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

    public List<ManagerCvResponseDto> getAllVisibleCvs() {
        List<CV> cvs = cvRepository.findByVisibility(CvVisibility.VISIBLE);

        return cvs.stream().map(ManagerCvResponseDto::of).toList();
    }

    public ManagerCvResponseDto getCv(long cvId) throws CvNotFoundException {
        return ManagerCvResponseDto.of(findVisibleCv(cvId));
    }

    public CvFileResponseDto getCvFile(long cvId) throws CvNotFoundException {
        return CvFileResponseDto.of(findVisibleCv(cvId));
    }

    @Transactional
    public ManagerCvResponseDto approveCv(long cvId) throws CvNotFoundException {
        CV cv = findVisibleCv(cvId);

        if (cv.getStatus() == CvStatus.APPROVED) {
            return ManagerCvResponseDto.of(cv);
        }
        cv.setStatus(CvStatus.APPROVED);
        cv.setRejectionComment(null);

        notifyStudentOfCvReviewDecision(cv, NotificationType.CV_APPROVED, NotificationType.CV_APPROVED.getMessage());

        return saveAndConvert(cv);
    }

    @Transactional
    public ManagerCvResponseDto rejectCv(long cvId, String comment) throws CvNotFoundException {
        CV cv = findVisibleCv(cvId);

        if (cv.getStatus() == CvStatus.REJECTED && comment.equals(cv.getRejectionComment())) {
            return ManagerCvResponseDto.of(cv);
        }

        cv.setStatus(CvStatus.REJECTED);
        cv.setRejectionComment(comment);

        notifyStudentOfCvReviewDecision(cv, NotificationType.CV_REJECTED, comment);

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

        notifyMatchingStudentsOfInternship(internship);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto rejectInternship(long internshipId, String comment) throws InternshipNotFoundException {
        Internship internship = findInternship(internshipId);

        internship.reject(comment);
        internshipRepository.save(internship);

        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, internshipId);

        return InternshipResponseDto.of(internship);
    }

    private Internship findInternship(long internshipId) throws InternshipNotFoundException {
        return internshipRepository.findByIdAndDeletedFalse(internshipId).orElseThrow(() -> new InternshipNotFoundException(internshipId));
    }

    private CV findVisibleCv(long cvId) throws CvNotFoundException {
        return cvRepository.findByIdAndVisibility(cvId, CvVisibility.VISIBLE).orElseThrow(() -> new CvNotFoundException("CV with ID " + cvId + " not found."));
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

    private void notifyStudentOfCvReviewDecision(CV cv, NotificationType notificationType, String message) {
        notificationService.closeNotificationsOfTarget(TargetType.CV, cv.getId());
        notificationService.notifyIfAbsent(notificationType, message, cv.getId(), cv.getStudent());
    }

    private void notifyMatchingStudentsOfInternship(Internship internship) {
        Discipline discipline = internship.getPostedBy().getDiscipline();

        studentRepository.findByDiscipline(discipline).stream()
                .filter(this::hasVisibleApprovedCv)
                .forEach(student -> notificationService.notifyIfAbsent(NotificationType.NEW_INTERNSHIP_OFFER, internship.getId(), student));
    }

    private boolean hasVisibleApprovedCv(Student student) {
        return cvRepository.findByStudent(student).stream()
                .anyMatch(cv -> cv.getVisibility() == CvVisibility.VISIBLE && cv.getStatus() == CvStatus.APPROVED);
    }
}