package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.document.DocumentNotFoundException;
import com.lacouf.rsbjwt.exception.document.student.cv.CVUsedInApplicationException;
import com.lacouf.rsbjwt.exception.internship.*;
import com.lacouf.rsbjwt.exception.internship_tracking.InternshipTrackingNotFoundException;
import com.lacouf.rsbjwt.exception.internship_tracking.TeacherDisciplineMismatchException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.StudentInternshipConsent;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.document.student.cv.TranslatedContent;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.Teacher;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import com.lacouf.rsbjwt.repository.document.student.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.internship_tracking.InternshipTrackingRepository;
import com.lacouf.rsbjwt.repository.internship_tracking.TeacherStudentCount;
import com.lacouf.rsbjwt.repository.interview.InterviewRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.repository.users.TeacherRepository;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.ManagerInternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship_tracking.InternshipTrackingResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.ManagerStudentSummaryDto;
import com.lacouf.rsbjwt.service.dto.response.user.TeacherAssignmentDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.internship.InternshipService;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import com.lacouf.rsbjwt.service.traduction.Internship.InternshipChangedEvent;
import com.lacouf.rsbjwt.service.traduction.TraductionService;
import com.lacouf.rsbjwt.service.traduction.cv.CVChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ManagerService {

    private final ApplicationEventPublisher eventPublisher;

    private final ManagerRepository managerRepository;
    private final CVRepository cvRepository;
    private final InternshipRepository internshipRepository;
    private final StudentRepository studentRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final InternshipTrackingRepository internshipTrackingRepository;
    private final TeacherRepository teacherRepository;
    private final InterviewRepository interviewRepository;
    private final ContractRepository contractRepository;

    private final AccountAccessService accountAccessService;
    private final NotificationService notificationService;
    private final UserAppService userAppService;
    private final InternshipService internshipService;
    private final AcademicSessionService academicSessionService;

    public ManagerService(ApplicationEventPublisher eventPublisher, ManagerRepository managerRepository, CVRepository cvRepository, InternshipRepository internshipRepository, StudentRepository studentRepository, InternshipApplicationRepository applicationRepository, InternshipTrackingRepository internshipTrackingRepository, TeacherRepository teacherRepository, InterviewRepository interviewRepository, AccountAccessService accountAccessService, NotificationService notificationService, UserAppService userAppService, InternshipService internshipService, AcademicSessionService academicSessionService, ContractRepository contractRepository) {
        this.eventPublisher = eventPublisher;
        this.managerRepository = managerRepository;
        this.cvRepository = cvRepository;
        this.internshipRepository = internshipRepository;
        this.studentRepository = studentRepository;
        this.applicationRepository = applicationRepository;
        this.internshipTrackingRepository = internshipTrackingRepository;
        this.teacherRepository = teacherRepository;
        this.interviewRepository = interviewRepository;
        this.accountAccessService = accountAccessService;
        this.notificationService = notificationService;
        this.userAppService = userAppService;
        this.internshipService = internshipService;
        this.academicSessionService = academicSessionService;
        this.contractRepository = contractRepository;
    }

    public UserResponseDto save(String firstName, String lastName, String email, String password, String phoneNumber) throws UserAlreadyExistsException {
        Credentials credentials = userAppService.createCredentials(email, password, Role.MANAGER);

        Manager manager = new Manager(firstName, lastName, credentials, userAppService.formatPhoneNumber(phoneNumber));

        managerRepository.save(manager);

        return UserResponseDto.of(manager);
    }

    @Transactional(readOnly = true)
    public List<ManagerCvResponseDto> getVisibleCvs(Long sessionId, String lang) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);
        List<CV> cvs = cvRepository.findByVisibilityAndSession(DocumentVisibility.VISIBLE, session);
        String targetLang = TraductionService.normalizeLang(lang);

        return cvs.stream().map(cv -> toManagerCvResponseDto(cv, targetLang)).toList();
    }

    @Transactional(readOnly = true)
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
        eventPublisher.publishEvent(CVChangedEvent.of(cv));

        return saveAndConvert(cv);
    }

    @Transactional(readOnly = true)
    public List<InternshipResponseDto> getPendingInternships(String lang) {
        String targetLang = TraductionService.normalizeLang(lang);
        return internshipRepository.findByStatusAndDeletedFalse(ReviewStatus.PENDING).stream().map(internship -> InternshipResponseDto.of(internship, targetLang == null ? null : internship.getTranslation(targetLang).orElse(null))).toList();
    }

    @Transactional(readOnly = true)
    public List<ManagerInternshipResponseDto> getAllInternships(Long sessionId, String lang) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);
        Set<Long> internshipIdsWithApplications = applicationRepository.findInternshipIdsByInternshipSession(session);
        String targetLang = TraductionService.normalizeLang(lang);

        return internshipRepository.findBySessionAndDeletedFalse(session).stream()
                .map(internship -> ManagerInternshipResponseDto.of(internship, internshipIdsWithApplications.contains(internship.getId()), targetLang == null ? null : internship.getTranslation(targetLang).orElse(null)))
                .toList();
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
        eventPublisher.publishEvent(InternshipChangedEvent.of(internship));

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto updateInternship(long internshipId, InternshipRequestDto internshipRequestDto) throws InternshipNotFoundException, InvalidCompensationException, InvalidInternshipDateException, InternshipStartDateOutsideTargetSessionException, PastSessionInternshipNotEditableException, InternshipWithApplicationsNotEditableException {
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

    @Transactional(readOnly = true)
    public List<InternshipTrackingResponseDto> getInternshipTrackings() {
        return internshipTrackingRepository.findAll().stream().map(InternshipTrackingResponseDto::of).toList();
    }

    @Transactional(readOnly = true)
    public List<TeacherAssignmentDto> getAssignableTeachers(long trackingId) throws InternshipTrackingNotFoundException {
        InternshipTracking tracking = findTracking(trackingId);

        List<Teacher> teachers = teacherRepository.findByDiscipline(tracking.getStudent().getDiscipline());

        if (teachers.isEmpty()) {
            return List.of();
        }

        Map<Long, Long> counts = internshipTrackingRepository
                .countByTeacherIds(teachers.stream().map(Teacher::getId).toList()).stream()
                .collect(Collectors.toMap(TeacherStudentCount::getTeacherId, TeacherStudentCount::getTotal));

        return teachers.stream()
                .map(teacher -> TeacherAssignmentDto.of(teacher, counts.getOrDefault(teacher.getId(), 0L)))
                .toList();
    }

    @Transactional
    public InternshipTrackingResponseDto assignTeacher(long trackingId, long teacherId)
            throws InternshipTrackingNotFoundException, UserNotFoundException, TeacherDisciplineMismatchException {
        InternshipTracking tracking = findTracking(trackingId);

        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(UserNotFoundException::new);

        if (teacher.getDiscipline() != tracking.getStudent().getDiscipline()) {
            throw new TeacherDisciplineMismatchException(teacherId, trackingId);
        }

        tracking.assignTeacher(teacher);

        notifyTeacherOfEvaluationToFill(tracking.getWorkplaceEvaluation(), teacher);

        return InternshipTrackingResponseDto.of(internshipTrackingRepository.save(tracking));
    }

    @Transactional(readOnly = true)
    public List<ManagerStudentSummaryDto> getStudentsSummary() throws UserNotFoundException {
        List<ManagerStudentSummaryDto> summaries = new ArrayList<>();

        for (Student student : studentRepository.findAll()) {
            summaries.add(toSummary(student));
        }

        return summaries;
    }

    private ManagerStudentSummaryDto toSummary(Student student) throws UserNotFoundException {
        Set<CV> cvs = student.getCvs().stream()
                .filter(cv -> cv.getVisibility() == DocumentVisibility.VISIBLE)
                .collect(Collectors.toSet());
        long cvCount = cvs.size();
        long cvPending = cvs.stream().filter(cv -> cv.getStatus() == ReviewStatus.PENDING).count();
        long cvDenied = cvs.stream().filter(cv -> cv.getStatus() == ReviewStatus.REJECTED).count();

        long applications = applicationRepository.countByStudent(student);
        long interviews = interviewRepository.countByInternshipApplication_Student(student);
        long upcomingInterviews = interviewRepository.countByInternshipApplication_StudentAndInterviewDateAfter(student, LocalDateTime.now());
        long completedAwaitingAnswer = interviewRepository.countByInternshipApplication_StudentAndInternshipApplication_EmployerDecisionAndInterviewDateBefore(student, EmployerDecision.INTERVIEW_OFFERED, LocalDateTime.now());
        long offersPending = applicationRepository.countByStudentAndEmployerDecisionAndStudentInternshipConsent(student, EmployerDecision.INTERNSHIP_OFFERED, StudentInternshipConsent.PENDING);
        boolean hasToSignContract = contractRepository.existsByStudentAndStudentSignedAtIsNull(student);
        boolean hasSignedContract = contractRepository.existsByStudentAndStudentSignedAtIsNotNull(student);

        boolean hasFoundInternship = student.isEmployed();

        return new ManagerStudentSummaryDto(
                student.getId(),
                student.getFirstName(),
                student.getLastName(),
                accountAccessService.getAccountStatus(student.getEmail()),
                cvCount, cvPending, cvDenied,
                applications, interviews, upcomingInterviews, completedAwaitingAnswer,
                offersPending, hasFoundInternship, hasToSignContract, hasSignedContract
        );
    }

    private InternshipTracking findTracking(long trackingId) throws InternshipTrackingNotFoundException {
        return internshipTrackingRepository.findById(trackingId)
                .orElseThrow(() -> new InternshipTrackingNotFoundException(trackingId));
    }

    private void notifyTeacherOfEvaluationToFill(WorkplaceEvaluation evaluation, Teacher teacher) {
        if (evaluation.isSigned()) {
            return;
        }

        notificationService.closeNotificationsOfType(evaluation.getToFillNotification(), evaluation.getId());
        notificationService.notifyIfAbsent(evaluation.getToFillNotification(), evaluation.getId(), teacher);
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

    private ManagerCvResponseDto toManagerCvResponseDto(CV cv, String targetLang) {
        TranslatedContent translation = targetLang == null
                ? null
                : cv.getTranslation(targetLang).orElse(null);

        return ManagerCvResponseDto.of(cv, applicationRepository.existsByCv(cv), translation);
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