package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.internship.InternshipService;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ManagerService {
    private final ManagerRepository managerRepository;
    private final CVRepository cvRepository;
    private final InternshipRepository internshipRepository;
    private final StudentRepository studentRepository;

    private final NotificationService notificationService;
    private final UserAppService userAppService;
    private final InternshipService internshipService;

    public ManagerService(ManagerRepository managerRepository, CVRepository cvRepository, InternshipRepository internshipRepository, StudentRepository studentRepository, NotificationService notificationService, UserAppService userAppService, InternshipService internshipService) {
        this.managerRepository = managerRepository;
        this.cvRepository = cvRepository;
        this.internshipRepository = internshipRepository;
        this.studentRepository = studentRepository;
        this.notificationService = notificationService;
        this.userAppService = userAppService;
        this.internshipService = internshipService;
    }

    public UserResponseDto save(String firstName, String lastName, String email, String password, String phoneNumber) throws UserAlreadyExistsException {
        Credentials credentials = userAppService.createCredentials(email, password, Role.MANAGER);

        Manager manager = new Manager(firstName, lastName, credentials, userAppService.formatPhoneNumber(phoneNumber));

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

        if (cv.getStatus() == ReviewStatus.APPROVED) {
            return ManagerCvResponseDto.of(cv);
        }

        boolean isFirstApprovedCv = !hasVisibleApprovedCv(cv.getStudent());

        cv.setStatus(ReviewStatus.APPROVED);
        cv.setRejectionComment(null);

        notifyStudentOfCvReviewDecision(cv, NotificationType.CV_APPROVED, NotificationType.CV_APPROVED.getMessage());

        if (isFirstApprovedCv) {
            notifyStudentOfOpenInternships(cv.getStudent());
        }

        return saveAndConvert(cv);
    }

    @Transactional
    public ManagerCvResponseDto rejectCv(long cvId, String comment) throws CvNotFoundException {
        CV cv = findVisibleCv(cvId);

        if (cv.getStatus() == ReviewStatus.REJECTED && comment.equals(cv.getRejectionComment())) {
            return ManagerCvResponseDto.of(cv);
        }

        cv.setStatus(ReviewStatus.REJECTED);
        cv.setRejectionComment(comment);

        notifyStudentOfCvReviewDecision(cv, NotificationType.CV_REJECTED, comment);

        return saveAndConvert(cv);
    }

    public List<InternshipResponseDto> getPendingInternships() {
        return internshipRepository.findByStatusAndDeletedFalse(ReviewStatus.PENDING).stream().map(InternshipResponseDto::of).toList();
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

        if (internship.getStatus() == ReviewStatus.APPROVED) {
            return InternshipResponseDto.of(internship);
        }

        internship.approve();
        internshipRepository.save(internship);

        notifyOfInternshipApproval(internship);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto rejectInternship(long internshipId, String comment) throws InternshipNotFoundException {
        Internship internship = findInternship(internshipId);

        internship.reject(comment);
        internshipRepository.save(internship);

        notifyEmployerOfInternshipReviewDecision(internship, NotificationType.INTERNSHIP_OFFER_REJECTED, comment);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto updateInternship(long internshipId, InternshipRequestDto internshipRequestDto) throws InternshipNotFoundException, InvalidCompensationException, InvalidInternshipDateException {
        Internship internship = findInternship(internshipId);
        boolean wasAlreadyApproved = internship.getStatus() == ReviewStatus.APPROVED;

        internshipService.updateDetails(internship, internshipRequestDto);
        internship.approve();
        internshipRepository.save(internship);

        if (!wasAlreadyApproved) {
            notifyOfInternshipApproval(internship);
        }

        return InternshipResponseDto.of(internship);
    }

    private Internship findInternship(long internshipId) throws InternshipNotFoundException {
        return internshipRepository.findByIdAndDeletedFalse(internshipId).orElseThrow(() -> new InternshipNotFoundException(internshipId));
    }

    private CV findVisibleCv(long cvId) throws CvNotFoundException {
        return cvRepository.findByIdAndVisibility(cvId, CvVisibility.VISIBLE).orElseThrow(() -> new CvNotFoundException(cvId));
    }

    private ManagerCvResponseDto saveAndConvert(CV cv) {
        cvRepository.save(cv);

        return ManagerCvResponseDto.of(cv);
    }

    private void notifyStudentOfCvReviewDecision(CV cv, NotificationType notificationType, String message) {
        notificationService.closeNotificationsOfTarget(TargetType.CV, cv.getId());
        notificationService.notifyIfAbsent(notificationType, message, cv.getId(), cv.getStudent());
    }

    private void notifyOfInternshipApproval(Internship internship) {
        notifyEmployerOfInternshipReviewDecision(internship, NotificationType.INTERNSHIP_OFFER_APPROVED, NotificationType.INTERNSHIP_OFFER_APPROVED.getMessage());
        notifyMatchingStudentsOfInternship(internship);
    }

    private void notifyEmployerOfInternshipReviewDecision(Internship internship, NotificationType notificationType, String message) {
        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, internship.getId());
        notificationService.notifyIfAbsent(notificationType, message, internship.getId(), internship.getPostedBy());
    }

    private void notifyMatchingStudentsOfInternship(Internship internship) {
        Discipline discipline = internship.getPostedBy().getDiscipline();

        studentRepository.findByDiscipline(discipline).stream()
                .filter(this::hasVisibleApprovedCv)
                .forEach(student -> notifyStudentOfNewInternship(internship, student));
    }

    private void notifyStudentOfOpenInternships(Student student) {
        internshipRepository.findByPostedBy_DisciplineAndStatusAndDeletedFalseAndApplicationDeadlineGreaterThanEqual(student.getDiscipline(), ReviewStatus.APPROVED, LocalDate.now())
                .forEach(internship -> notifyStudentOfNewInternship(internship, student));
    }

    private void notifyStudentOfNewInternship(Internship internship, Student student) {
        notificationService.notifyIfAbsent(NotificationType.NEW_INTERNSHIP_OFFER, internship.getId(), student);
    }

    private boolean hasVisibleApprovedCv(Student student) {
        return cvRepository.findByStudent(student).stream()
                .anyMatch(cv -> cv.getVisibility() == CvVisibility.VISIBLE && cv.getStatus() == ReviewStatus.APPROVED);
    }
}