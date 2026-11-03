package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.application.*;
import com.lacouf.rsbjwt.exception.contract.ApplicationRejectedException;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadyActiveException;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadyExistsException;
import com.lacouf.rsbjwt.exception.contract.StudentAlreadyEmployedException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.exception.interview.InterviewAlreadyExistsException;
import com.lacouf.rsbjwt.exception.interview.InterviewCancelledException;
import com.lacouf.rsbjwt.exception.interview.InterviewAlreadyPassedException;
import com.lacouf.rsbjwt.exception.interview.InterviewNotFoundException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.document.Document;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.interview.InterviewStatus;
import com.lacouf.rsbjwt.model.interview.MeetingType;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.interview.InterviewRepository;
import com.lacouf.rsbjwt.repository.users.EmployerRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.service.contract.ContractService;
import com.lacouf.rsbjwt.service.dto.request.interview.InterviewRequestDto;
import com.lacouf.rsbjwt.service.dto.response.application.ReceivedInternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.contracts.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.interview.InterviewEmployerResponseDTO;
import com.lacouf.rsbjwt.service.dto.response.interview.MeetingTypeDTO;
import com.lacouf.rsbjwt.service.internship.InternshipService;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.request.signup.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
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

    private final NotificationService notificationService;
    private final UserAppService userAppService;
    private final InternshipService internshipService;
    private final AcademicSessionService academicSessionService;
    private final ContractService contractService;

    public EmployerService(EmployerRepository employerRepository, InternshipRepository internshipRepository, ManagerRepository managerRepository, NotificationService notificationService, UserAppService userAppService, InternshipApplicationRepository internshipApplicationRepository, InterviewRepository interviewRepository, InternshipService internshipService, AcademicSessionService academicSessionService, ContractService contractService) {
        this.employerRepository = employerRepository;
        this.internshipRepository = internshipRepository;
        this.managerRepository = managerRepository;
        this.notificationService = notificationService;
        this.userAppService = userAppService;
        this.internshipApplicationRepository = internshipApplicationRepository;
        this.interviewRepository = interviewRepository;
        this.internshipService = internshipService;
        this.academicSessionService = academicSessionService;
        this.contractService = contractService;
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
    public InternshipResponseDto saveInternship(InternshipRequestDto internshipDto, String employerEmail) throws UserNotFoundException, InvalidInternshipDateException, InvalidCompensationException {
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
                academicSessionService.getCurrentSession()
        );

        internshipRepository.save(internship);

        notifyManagersOfSubmittedInternship(internship);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public InternshipResponseDto updateInternship(long id, InternshipRequestDto dto, String employerEmail) throws InternshipNotFoundException, InvalidInternshipDateException, InvalidCompensationException {
        Internship internship = internshipRepository
                .findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(id, employerEmail)
                .orElseThrow(() -> new InternshipNotFoundException(id));

        internshipService.updateDetails(internship, dto);
        internship.resubmitForReview();

        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, id);

        internshipRepository.save(internship);

        notifyManagersOfSubmittedInternship(internship);

        return InternshipResponseDto.of(internship);
    }

    @Transactional
    public void deleteInternship(long id, String employerEmail) throws InternshipNotFoundException {
        Internship internship = internshipRepository.findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(id, employerEmail)
                .orElseThrow(() -> new InternshipNotFoundException(id));

        internship.markAsDeleted();

        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, id);
        closeNewInternshipApplicationNotifications(internship);

        cancelInterviewsOfInternship(internship);

        internshipRepository.save(internship);
    }

    public List<InternshipResponseDto> getInternshipsOfEmployer(String email, Long sessionId) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);
        List<Internship> internships = internshipRepository.findByPostedBy_Credentials_EmailAndSessionAndDeletedIsFalse(email, session);

        return internships.stream()
                .map(InternshipResponseDto::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReceivedInternshipApplicationResponseDto> getReceivedInternshipApplications(String email, Long sessionId) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);

        return internshipApplicationRepository.findByInternship_PostedBy_Credentials_EmailAndInternship_SessionAndInternship_DeletedFalse(email, session)
                .stream()
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
    public void createInterview(long applicationId, String email, InterviewRequestDto interviewRequestDto) throws InternshipApplicationNotFoundException, InterviewAlreadyExistsException, ApplicationRejectedException, ApplicationAlreadyHiredException {

        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        if (internshipApplication.getEmployerDecision() == EmployerDecision.REJECTED) {
            throw new ApplicationRejectedException(applicationId);
        }

        if (internshipApplication.getEmployerDecision() == EmployerDecision.INTERNSHIP_OFFERED) {
            throw new ApplicationAlreadyHiredException(applicationId);
        }

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
        interviewRepository.save(interview);
    }

    @Transactional
    public void acceptInternshipApplicationForInterview(long applicationId, String email) throws InternshipApplicationNotFoundException, ApplicationRejectedException, ApplicationAlreadyHiredException {
        InternshipApplication application = findReceivedInternshipApplication(applicationId, email);

        if (application.getEmployerDecision() == EmployerDecision.REJECTED) {
            throw new ApplicationRejectedException(applicationId);
        }
        if (application.getEmployerDecision() == EmployerDecision.INTERNSHIP_OFFERED) {
            throw new ApplicationAlreadyHiredException(applicationId);
        }

        updateEmployerDecisionForInterview(application, EmployerDecision.ACCEPTED);
    }

    @Transactional
    public void rejectInternshipApplication(long applicationId, String email) throws InternshipApplicationNotFoundException, ContractAlreadyActiveException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        contractService.terminateForRejection(internshipApplication);

        rejectApplication(internshipApplication);
    }

    @Transactional(readOnly = true)
    public List<InterviewEmployerResponseDTO> getInterviewsOfEmployer(String email) {
        return interviewRepository.findByEmployer_Credentials_EmailAndInternshipApplication_Internship_DeletedFalse(email)
                .stream()
                .map(InterviewEmployerResponseDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InterviewEmployerResponseDTO> getInterviewsByApplicationId(long applicationId, String email) throws InternshipApplicationNotFoundException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        return interviewRepository.findByInternshipApplication(internshipApplication)
                .stream()
                .map(InterviewEmployerResponseDTO::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public MeetingTypeDTO getMeetingTypes() {
        return MeetingTypeDTO.of(Arrays.asList(MeetingType.values()));
    }

    @Transactional
    public InterviewEmployerResponseDTO updateInterview(long interviewId, String email, InterviewRequestDto interviewRequestDto) throws InterviewNotFoundException, InterviewCancelledException, InterviewAlreadyPassedException {
        Interview interview = findModifiableInterview(interviewId, email);

        interview.update(
                interviewRequestDto.message(),
                interviewRequestDto.interviewDate(),
                interviewRequestDto.meetingType(),
                interviewRequestDto.meetingDetails()
        );

        interviewRepository.save(interview);

        return InterviewEmployerResponseDTO.of(interview);
    }

    @Transactional
    public InterviewEmployerResponseDTO cancelInterview(long interviewId, String email) throws InterviewNotFoundException, InterviewCancelledException, InterviewAlreadyPassedException {
        Interview interview = findModifiableInterview(interviewId, email);

        cancelAndSaveInterview(interview);

        return InterviewEmployerResponseDTO.of(interview);
    }

    @Transactional(rollbackFor = Exception.class)
    public void offerContracts(List<Long> applicationIds, String email) throws InternshipApplicationNotFoundException, StudentAlreadyEmployedException, ApplicationRejectedException, ContractAlreadyExistsException {
        for (Long applicationId : new LinkedHashSet<>(applicationIds)) {
            hire(findReceivedInternshipApplication(applicationId, email));
        }
    }

    @Transactional(readOnly = true)
    public List<ContractResponseDto> getContractsOfEmployer(String email) throws UserNotFoundException {
        Employer employer = employerRepository.findByCredentialsEmail(email)
                .orElseThrow(UserNotFoundException::new);
        return contractService.getContractsOfEmployer(employer);
    }

    private void hire(InternshipApplication application) throws StudentAlreadyEmployedException, ApplicationRejectedException, ContractAlreadyExistsException {
        contractService.createContract(application);
        application.updateEmployerDecision(EmployerDecision.INTERNSHIP_OFFERED);
        internshipApplicationRepository.save(application);
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
        interview.cancel();
        interviewRepository.save(interview);
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

    private void closeNewInternshipApplicationNotifications(Internship internship) {
        internshipApplicationRepository.findByInternship(internship)
                .forEach(application -> closeNewInternshipApplicationNotification(application.getId()));
    }

    private void closeNewInternshipApplicationNotification(long applicationId) {
        notificationService.closeNotificationsOfType(NotificationType.NEW_INTERNSHIP_APPLICATION, applicationId);
    }
}
