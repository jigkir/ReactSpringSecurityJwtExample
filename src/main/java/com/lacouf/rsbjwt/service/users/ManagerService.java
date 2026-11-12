package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.contract.ContractAlreadySignedException;
import com.lacouf.rsbjwt.exception.contract.ContractNotFoundException;
import com.lacouf.rsbjwt.exception.document.DocumentNotFoundException;
import com.lacouf.rsbjwt.exception.document.student.cv.CVUsedInApplicationException;
import com.lacouf.rsbjwt.exception.internship.*;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.contract.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.contract.ContractLanguage;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.document.student.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.service.contract.ContractService;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.internship.InternshipService;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
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
    private final InternshipApplicationRepository applicationRepository;

    private final NotificationService notificationService;
    private final UserAppService userAppService;
    private final InternshipService internshipService;
    private final AcademicSessionService academicSessionService;
    private final ContractService contractService;

    public ManagerService(ManagerRepository managerRepository, CVRepository cvRepository, InternshipRepository internshipRepository, StudentRepository studentRepository, InternshipApplicationRepository applicationRepository, NotificationService notificationService, UserAppService userAppService, InternshipService internshipService, AcademicSessionService academicSessionService, ContractService contractService) {
        this.managerRepository = managerRepository;
        this.cvRepository = cvRepository;
        this.internshipRepository = internshipRepository;
        this.studentRepository = studentRepository;
        this.applicationRepository = applicationRepository;
        this.notificationService = notificationService;
        this.userAppService = userAppService;
        this.internshipService = internshipService;
        this.academicSessionService = academicSessionService;
        this.contractService = contractService;
    }

    public UserResponseDto save(String firstName, String lastName, String email, String password, String phoneNumber) throws UserAlreadyExistsException {
        Credentials credentials = userAppService.createCredentials(email, password, Role.MANAGER);

        Manager manager = new Manager(firstName, lastName, credentials, userAppService.formatPhoneNumber(phoneNumber));

        managerRepository.save(manager);

        return UserResponseDto.of(manager);
    }

    public List<ManagerCvResponseDto> getVisibleCvs(Long sessionId) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);
        List<CV> cvs = cvRepository.findByVisibilityAndSession(DocumentVisibility.VISIBLE, session);

        return cvs.stream().map(this::toManagerCvResponseDto).toList();
    }

    public List<ManagerCvResponseDto> getPendingCvs() {
        return cvRepository.findByVisibilityAndStatus(DocumentVisibility.VISIBLE, ReviewStatus.PENDING).stream().map(this::toManagerCvResponseDto).toList();
    }

    public ManagerCvResponseDto getCv(long cvId) throws DocumentNotFoundException {
        return toManagerCvResponseDto(findVisibleCv(cvId));
    }

    public DocumentFileResponseDto getCvFile(long cvId) throws DocumentNotFoundException {
        return DocumentFileResponseDto.of(findVisibleCv(cvId));
    }

    @Transactional
    public ManagerCvResponseDto approveCv(long cvId) throws DocumentNotFoundException {
        CV cv = findVisibleCv(cvId);

        if (cv.getStatus() == ReviewStatus.APPROVED) {
            return toManagerCvResponseDto(cv);
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
    public ManagerCvResponseDto rejectCv(long cvId, String comment) throws DocumentNotFoundException, CVUsedInApplicationException {
        CV cv = findVisibleCv(cvId);

        if (applicationRepository.existsByCv(cv)) {
            throw new CVUsedInApplicationException(cvId);
        }

        if (cv.getStatus() == ReviewStatus.REJECTED && comment.equals(cv.getRejectionComment())) {
            return toManagerCvResponseDto(cv);
        }

        cv.setStatus(ReviewStatus.REJECTED);
        cv.setRejectionComment(comment);

        notifyStudentOfCvReviewDecision(cv, NotificationType.CV_REJECTED, comment);

        return saveAndConvert(cv);
    }

    public List<InternshipResponseDto> getPendingInternships() {
        return internshipRepository.findByStatusAndDeletedFalse(ReviewStatus.PENDING).stream().map(InternshipResponseDto::of).toList();
    }

    public List<InternshipResponseDto> getAllInternships(Long sessionId) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);

        return internshipRepository.findBySessionAndDeletedFalse(session).stream().map(InternshipResponseDto::of).toList();
    }

    public InternshipResponseDto getInternshipById(long internshipId) throws InternshipNotFoundException {
        return InternshipResponseDto.of(findInternship(internshipId));
    }

    @Transactional
    public InternshipResponseDto approveInternship(long internshipId) throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        Internship internship = findInternshipOfTargetSession(internshipId);

        if (internship.getStatus() == ReviewStatus.APPROVED) {
            return InternshipResponseDto.of(internship);
        }

        internship.approve();
        internshipRepository.save(internship);

        notifyOfInternshipApproval(internship);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto rejectInternship(long internshipId, String comment) throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        Internship internship = findInternshipOfTargetSession(internshipId);

        internship.reject(comment);
        internshipRepository.save(internship);

        notifyEmployerOfInternshipReviewDecision(internship, NotificationType.INTERNSHIP_OFFER_REJECTED, comment);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto updateInternship(long internshipId, InternshipRequestDto internshipRequestDto) throws InternshipNotFoundException, InvalidCompensationException, InvalidInternshipDateException, InternshipStartDateOutsideTargetSessionException, PastSessionInternshipNotEditableException {
        Internship internship = findInternship(internshipId);
        boolean wasAlreadyApproved = internship.getStatus() == ReviewStatus.APPROVED;

        internshipService.updateDetails(internship, internshipRequestDto, academicSessionService.getTargetSessionForUpdate(internship.getSession(), internshipRequestDto.startDate()));
        internship.approve();
        internshipRepository.save(internship);

        if (!wasAlreadyApproved) {
            notifyOfInternshipApproval(internship);
        }

        return InternshipResponseDto.of(internship);
    }

    public List<ContractResponseDto> getContracts(Long sessionId) throws AcademicSessionNotFoundException {
        return contractService.getContracts(academicSessionService.findSessionOrCurrent(sessionId));
    }

    public ContractResponseDto signContract(String email, long contractId, String password) throws UserNotFoundException, IncorrectSignaturePasswordException, ContractNotFoundException, ContractAlreadySignedException {
        Manager manager = managerRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);

        userAppService.verifyIfSignaturePasswordIsIncorrect(manager, password);

        return contractService.signAsManager(contractId, manager);
    }

    public DocumentFileResponseDto getContractFile(long contractId, ContractLanguage language) throws ContractNotFoundException {
        return contractService.getContractFile(contractId, language);
    }

    private Internship findInternship(long internshipId) throws InternshipNotFoundException {
        return internshipRepository.findByIdAndDeletedFalse(internshipId).orElseThrow(() -> new InternshipNotFoundException(internshipId));
    }

    private Internship findInternshipOfTargetSession(long internshipId) throws InternshipNotFoundException, PastSessionInternshipNotEditableException {
        Internship internship = findInternship(internshipId);

        academicSessionService.verifyInternshipIsInTargetSession(internship.getSession());

        return internship;
    }

    private CV findVisibleCv(long cvId) throws DocumentNotFoundException {
        return cvRepository.findByIdAndVisibility(cvId, DocumentVisibility.VISIBLE).orElseThrow(() -> new DocumentNotFoundException(cvId));
    }

    private ManagerCvResponseDto saveAndConvert(CV cv) {
        cvRepository.save(cv);

        return toManagerCvResponseDto(cv);
    }

    private ManagerCvResponseDto toManagerCvResponseDto(CV cv) {
        return ManagerCvResponseDto.of(cv, applicationRepository.existsByCv(cv));
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
        return cvRepository.findByUser(student).stream()
                .anyMatch(cv -> cv.getVisibility() == DocumentVisibility.VISIBLE && cv.getStatus() == ReviewStatus.APPROVED);
    }
}