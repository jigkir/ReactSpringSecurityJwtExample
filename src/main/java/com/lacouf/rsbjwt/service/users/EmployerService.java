package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.APIException;
import com.lacouf.rsbjwt.exception.application.*;
import com.lacouf.rsbjwt.exception.contract.ApplicationRejectedException;
import com.lacouf.rsbjwt.exception.contract.StudentAlreadyEmployedException;
import com.lacouf.rsbjwt.exception.internship.*;
import com.lacouf.rsbjwt.exception.interview.*;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.StudentInternshipConsent;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.interview.InterviewCancellationReason;
import com.lacouf.rsbjwt.model.interview.InterviewStatus;
import com.lacouf.rsbjwt.model.interview.MeetingType;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import com.lacouf.rsbjwt.repository.interview.InterviewRepository;
import com.lacouf.rsbjwt.repository.users.EmployerRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.service.dto.request.interview.InterviewRequestDto;
import com.lacouf.rsbjwt.service.dto.response.application.ReceivedInternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.interview.InterviewEmployerResponseDto;
import com.lacouf.rsbjwt.service.dto.response.interview.MeetingTypeDTO;
import com.lacouf.rsbjwt.service.internship.InternshipService;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.request.signup.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import com.lacouf.rsbjwt.service.traduction.TraductionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmployerService {
    private final EmployerRepository employerRepository;
    private final InternshipRepository internshipRepository;
    private final ManagerRepository managerRepository;
    private final InternshipApplicationRepository internshipApplicationRepository;
    private final InterviewRepository interviewRepository;
    private final ContractRepository contractRepository;

    private final NotificationService notificationService;
    private final UserAppService userAppService;
    private final InternshipService internshipService;
    private final AcademicSessionService academicSessionService;
    private final TraductionService traductionService;

    public EmployerService(EmployerRepository employerRepository, InternshipRepository internshipRepository, ManagerRepository managerRepository, ContractRepository contractRepository, NotificationService notificationService, UserAppService userAppService, TraductionService traductionService, InternshipApplicationRepository internshipApplicationRepository, InterviewRepository interviewRepository, InternshipService internshipService, AcademicSessionService academicSessionService) {
        this.employerRepository = employerRepository;
        this.internshipRepository = internshipRepository;
        this.managerRepository = managerRepository;
        this.contractRepository = contractRepository;
        this.notificationService = notificationService;
        this.userAppService = userAppService;
        this.internshipApplicationRepository = internshipApplicationRepository;
        this.interviewRepository = interviewRepository;
        this.internshipService = internshipService;
        this.academicSessionService = academicSessionService;
        this.traductionService = traductionService;
    }

    public UserResponseDto save(EmployerSignUpDto employerDTO) throws UserAlreadyExistsException {
        Credentials credentials = userAppService.createCredentials(employerDTO.email(), employerDTO.password(), Role.EMPLOYER);

        Employer employer = new Employer(
                employerDTO.firstName(),
                employerDTO.lastName(),
                credentials,
                employerDTO.companyName(),
                employerDTO.discipline(),
                userAppService.formatPhoneNumber(employerDTO.phoneNumber())
        );

        employerRepository.save(employer);

        return UserResponseDto.of(employer);
    }

    @Transactional
    public InternshipResponseDto saveInternship(InternshipRequestDto internshipDto, String employerEmail) throws UserNotFoundException, InvalidInternshipDateException, InvalidCompensationException, InternshipStartDateOutsideTargetSessionException {
        internshipService.validateNewInternship(internshipDto);

        Employer employer = employerRepository.findByCredentialsEmail(employerEmail).orElseThrow(UserNotFoundException::new);

        Internship internship = new Internship(
                internshipDto.title(),
                internshipDto.description(),
                internshipDto.requiredSkills(),
                internshipDto.durationInWeeks(),
                internshipDto.location(),
                internshipDto.workMode(),
                internshipDto.startDate(),
                internshipDto.applicationDeadline(),
                internshipDto.compensationAmount(),
                internshipDto.compensationNegotiable(),
                employer,
                academicSessionService.getTargetSessionContaining(internshipDto.startDate())
        );

        internshipRepository.save(internship);

        notifyManagersOfSubmittedInternship(internship);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto updateInternship(long id, InternshipRequestDto dto, String employerEmail) throws InternshipNotFoundException, InvalidInternshipDateException, InvalidCompensationException, InternshipStartDateOutsideTargetSessionException, PastSessionInternshipNotEditableException, InternshipWithApplicationsNotEditableException {
        Internship internship = internshipRepository
                .findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(id, employerEmail)
                .orElseThrow(() -> new InternshipNotFoundException(id));

        internshipService.updateDetails(internship, dto, academicSessionService.getTargetSessionForUpdate(internship.getSession(), dto.startDate()));
        internship.resubmitForReview();

        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, id);

        internshipRepository.save(internship);

        notifyManagersOfSubmittedInternship(internship);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public void deleteInternship(long id, String employerEmail) throws InternshipNotFoundException, InternshipWithContractNotDeletableException {
        Internship internship = internshipRepository.findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(id, employerEmail)
                .orElseThrow(() -> new InternshipNotFoundException(id));

        if (contractRepository.existsByInternship(internship)) {
            throw new InternshipWithContractNotDeletableException(id);
        }

        internship.markAsDeleted();

        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, id);
        closeNewInternshipApplicationNotifications(internship);

        cancelInterviewsOfInternship(internship);

        internshipRepository.save(internship);
    }

    public List<InternshipResponseDto> getInternshipsOfEmployer(String email, Long sessionId, String lang) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);
        List<Internship> internships = internshipRepository.findByPostedBy_Credentials_EmailAndSessionAndDeletedIsFalse(email, session);

        List<InternshipResponseDto> dtos = internships.stream()
                .map(InternshipResponseDto::of)
                .toList();

        if (dtos.isEmpty() || lang == null) {
            return dtos;
        }

        return traductionService.translateInternships(dtos, lang);
    }

    @Transactional(readOnly = true)
    public List<ReceivedInternshipApplicationResponseDto> getReceivedInternshipApplications(String email, Long sessionId) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);

        return internshipApplicationRepository.findByInternship_PostedBy_Credentials_EmailAndInternship_SessionAndInternship_DeletedFalse(email, session)
                .stream()
                .filter(this::isVisibleToEmployer)
                .map(ReceivedInternshipApplicationResponseDto::of)
                .toList();
    }

    @Transactional
    public DocumentFileResponseDto openReceivedInternshipApplicationCv(long applicationId, String email) throws InternshipApplicationNotFoundException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        internshipApplication.markAsRead();

        internshipApplicationRepository.save(internshipApplication);

        closeNewInternshipApplicationNotification(applicationId);

        return DocumentFileResponseDto.of(internshipApplication.getCv());
    }

    @Transactional(readOnly = true)
    public DocumentFileResponseDto getReceivedInternshipApplicationCoverLetter(long applicationId, String email) throws InternshipApplicationNotFoundException, ApplicationDocumentNotFoundException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        return toAttachedDocumentFile(internshipApplication.getCoverLetter(), applicationId);
    }

    @Transactional(readOnly = true)
    public DocumentFileResponseDto getReceivedInternshipApplicationAcademicTranscript(long applicationId, String email) throws InternshipApplicationNotFoundException, ApplicationDocumentNotFoundException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        return toAttachedDocumentFile(internshipApplication.getAcademicTranscript(), applicationId);
    }

    public Map<Long, Long> countReceivedInternshipApplicationsByInternship(String email) {
        return internshipRepository.findByPostedBy_Credentials_EmailAndDeletedIsFalse(email)
                .stream()
                .collect(Collectors.toMap(Internship::getId, internshipApplicationRepository::countByInternship));
    }

    @Transactional
    public void createInterview(long applicationId, String email, InterviewRequestDto interviewRequestDto) throws InternshipApplicationNotFoundException, InterviewAlreadyExistsException, ApplicationRejectedException, InternshipAlreadyOfferedException, StudentAlreadyEmployedException {
        InternshipApplication internshipApplication = findApplicationOpenToDecision(applicationId, email);

        if (interviewRepository.existsByInternshipApplicationAndInterviewStatus(internshipApplication, InterviewStatus.SCHEDULED)) {
            throw new InterviewAlreadyExistsException(applicationId);
        }

        Employer employer = internshipApplication.getInternship().getPostedBy();

        Interview interview = new Interview(
                employer,
                internshipApplication,
                interviewRequestDto.message(),
                interviewRequestDto.interviewDate(),
                interviewRequestDto.meetingType(),
                interviewRequestDto.meetingDetails()
        );

        updateEmployerDecisionForInterview(internshipApplication, EmployerDecision.INTERVIEW_OFFERED);
        Interview savedInterview = interviewRepository.save(interview);

        notifyStudentOfInterview(savedInterview, NotificationType.INTERVIEW_CONVOCATION);
    }

    @Transactional
    public void acceptInternshipApplicationForInterview(long applicationId, String email) throws InternshipApplicationNotFoundException, ApplicationRejectedException, InternshipAlreadyOfferedException, StudentAlreadyEmployedException {
        InternshipApplication application = findApplicationOpenToDecision(applicationId, email);

        updateEmployerDecisionForInterview(application, EmployerDecision.ACCEPTED);
    }

    @Transactional
    public void rejectInternshipApplication(long applicationId, String email) throws InternshipApplicationNotFoundException, ApplicationAlreadyAcceptedException, ApplicationAlreadyRejectedException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        EmployerDecision decision = internshipApplication.getEmployerDecision();

        if (decision == EmployerDecision.REJECTED) {
            throw new ApplicationAlreadyRejectedException(applicationId);
        }

        if (decision != EmployerDecision.PENDING && decision != EmployerDecision.INTERVIEW_OFFERED) {
            throw new ApplicationAlreadyAcceptedException(applicationId);
        }

        rejectApplication(internshipApplication);
    }

    @Transactional(readOnly = true)
    public List<InterviewEmployerResponseDto> getInterviewsOfEmployer(String email) {
        return interviewRepository.findByEmployer_Credentials_EmailAndInternshipApplication_Internship_DeletedFalse(email)
                .stream()
                .map(InterviewEmployerResponseDto::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InterviewEmployerResponseDto> getInterviewsByApplicationId(long applicationId, String email) throws InternshipApplicationNotFoundException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        return interviewRepository.findByInternshipApplication(internshipApplication)
                .stream()
                .map(InterviewEmployerResponseDto::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public MeetingTypeDTO getMeetingTypes() {
        return MeetingTypeDTO.of(Arrays.asList(MeetingType.values()));
    }

    @Transactional
    public InterviewEmployerResponseDto updateInterview(long interviewId, String email, InterviewRequestDto interviewRequestDto) throws InterviewNotFoundException, InterviewCancelledException, InterviewAlreadyPassedException, InternshipAlreadyOfferedException {
        Interview interview = findModifiableInterview(interviewId, email);
        InternshipApplication application = interview.getInternshipApplication();

        if (application.getEmployerDecision() == EmployerDecision.INTERNSHIP_OFFERED) {
            throw new InternshipAlreadyOfferedException(application.getId());
        }

        interview.update(
                interviewRequestDto.message(),
                interviewRequestDto.interviewDate(),
                interviewRequestDto.meetingType(),
                interviewRequestDto.meetingDetails()
        );

        interviewRepository.save(interview);

        notificationService.closeNotificationsOfTarget(TargetType.INTERVIEW, interview.getId());
        notifyStudentOfInterview(interview, NotificationType.INTERVIEW_UPDATED);

        return InterviewEmployerResponseDto.of(interview);
    }

    @Transactional
    public InterviewEmployerResponseDto cancelInterview(long interviewId, String email) throws InterviewNotFoundException, InterviewCancelledException, InterviewAlreadyPassedException {
        Interview interview = findModifiableInterview(interviewId, email);

        cancelAndSaveInterview(interview);

        return InterviewEmployerResponseDto.of(interview);
    }

    @Transactional(rollbackFor = APIException.class)
    public void offerInternshipsToStudents(List<Long> applicationIds, String email) throws InternshipApplicationNotFoundException, ApplicationRejectedException, InternshipAlreadyOfferedException, StudentAlreadyEmployedException {

        for (Long applicationId : new LinkedHashSet<>(applicationIds)) {
            InternshipApplication internshipApplication = findApplicationOpenToDecision(applicationId, email);

            internshipApplication.updateEmployerDecision(EmployerDecision.INTERNSHIP_OFFERED);
            internshipApplication.setStudentInternshipConsent(StudentInternshipConsent.PENDING);
            internshipApplicationRepository.save(internshipApplication);

            notificationService.notifyInternshipOffered(internshipApplication);
        }
    }

    private Interview findModifiableInterview(long interviewId, String email) throws InterviewNotFoundException, InterviewAlreadyPassedException, InterviewCancelledException {
        Interview interview = interviewRepository.findByIdAndEmployer_Credentials_Email(interviewId, email)
                .orElseThrow(() -> new InterviewNotFoundException(interviewId));

        if (interview.getInterviewStatus() == InterviewStatus.CANCELLED) {
            throw new InterviewCancelledException(interviewId);
        }

        if (interview.getInterviewDate().isBefore(LocalDateTime.now())) {
            throw new InterviewAlreadyPassedException(interviewId);
        }

        return interview;
    }

    private void updateEmployerDecisionForInterview(InternshipApplication internshipApplication, EmployerDecision decision) {
        internshipApplication.updateEmployerDecision(decision);
        internshipApplicationRepository.save(internshipApplication);
    }

    private void cancelInterviewsOfInternship(Internship internship) {
        interviewRepository.findByInternshipApplication_Internship(internship)
                .forEach(this::cancelIfUpcoming);
    }

    private void cancelIfUpcoming(Interview interview) {
        if (interview.getInterviewStatus() == InterviewStatus.SCHEDULED
                && interview.getInterviewDate().isAfter(LocalDateTime.now())) {
            cancelAndSaveInterview(interview);
        }
    }

    private void cancelAndSaveInterview(Interview interview) {
        interview.cancel(InterviewCancellationReason.CANCELLED_BY_EMPLOYER);
        interviewRepository.save(interview);

        notificationService.closeNotificationsOfTarget(TargetType.INTERVIEW, interview.getId());
    }

    private void rejectApplication(InternshipApplication internshipApplication) {
        interviewRepository.findByInternshipApplication(internshipApplication)
                .forEach(this::cancelIfUpcoming);

        internshipApplication.updateEmployerDecision(EmployerDecision.REJECTED);
        internshipApplicationRepository.save(internshipApplication);
    }

    private void notifyManagersOfSubmittedInternship(Internship internship) {
        managerRepository.findAll()
                .forEach(manager -> notificationService.notifyIfAbsent(NotificationType.INTERNSHIP_SUBMITTED_FOR_REVIEW, internship.getId(), manager));
    }

    private void notifyStudentOfInterview(Interview interview, NotificationType notificationType) {
        Student student = interview.getInternshipApplication().getStudent();

        notificationService.notifyIfAbsent(notificationType, interview.getId(), student);
    }

    private DocumentFileResponseDto toAttachedDocumentFile(Document document, long applicationId) throws ApplicationDocumentNotFoundException {
        if (document == null) {
            throw new ApplicationDocumentNotFoundException(applicationId);
        }
        return DocumentFileResponseDto.of(document);
    }

    private InternshipApplication findReceivedInternshipApplication(long applicationId, String email) throws InternshipApplicationNotFoundException {
        return internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(applicationId, email)
                .orElseThrow(() -> new InternshipApplicationNotFoundException(applicationId));
    }

    private InternshipApplication findApplicationOpenToDecision(long applicationId, String email) throws InternshipApplicationNotFoundException, ApplicationRejectedException, InternshipAlreadyOfferedException, StudentAlreadyEmployedException {
        InternshipApplication application = findReceivedInternshipApplication(applicationId, email);
        EmployerDecision decision = application.getEmployerDecision();
        Student student = application.getStudent();

        if (decision == EmployerDecision.REJECTED) {
            throw new ApplicationRejectedException(applicationId);
        }

        if (decision == EmployerDecision.INTERNSHIP_OFFERED) {
            throw new InternshipAlreadyOfferedException(applicationId);
        }

        if (student.isEmployed()) {
            throw new StudentAlreadyEmployedException(application.getStudent().getId());
        }

        return application;
    }

    private void closeNewInternshipApplicationNotifications(Internship internship) {
        internshipApplicationRepository.findByInternship(internship)
                .forEach(application -> {
                    closeNewInternshipApplicationNotification(application.getId());
                    notificationService.closeNotificationsOfType(NotificationType.INTERNSHIP_OFFERED, application.getId());
                });
    }

    private void closeNewInternshipApplicationNotification(long applicationId) {
        notificationService.closeNotificationsOfType(NotificationType.NEW_INTERNSHIP_APPLICATION, applicationId);
    }

    private boolean isVisibleToEmployer(InternshipApplication application) {
        Student student = application.getStudent();
        boolean employed = student.isEmployed();
        boolean wasOffered = application.getStudentInternshipConsent() != StudentInternshipConsent.NOT_APPLICABLE;

        return !employed || wasOffered;
    }
}
