package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.application.ApplicationRejectedException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.exception.interview.InterviewAlreadyExistsException;
import com.lacouf.rsbjwt.exception.interview.InterviewCancelledException;
import com.lacouf.rsbjwt.exception.interview.InterviewNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.interview.InterviewStatus;
import com.lacouf.rsbjwt.model.interview.MeetingType;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.interview.InterviewRepository;
import com.lacouf.rsbjwt.repository.users.EmployerRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.service.dto.request.interview.InterviewRequestDto;
import com.lacouf.rsbjwt.service.dto.response.application.ReceivedInternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.interview.InterviewEmployerResponseDTO;
import com.lacouf.rsbjwt.service.dto.response.interview.MeetingTypeDTO;
import com.lacouf.rsbjwt.service.internship.InternshipService;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.request.signup.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
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

    public EmployerService(EmployerRepository employerRepository, InternshipRepository internshipRepository, ManagerRepository managerRepository, NotificationService notificationService, UserAppService userAppService, InternshipApplicationRepository internshipApplicationRepository, InterviewRepository InterviewRepository, InternshipService internshipService) {
        this.employerRepository = employerRepository;
        this.internshipRepository = internshipRepository;
        this.managerRepository = managerRepository;
        this.notificationService = notificationService;
        this.userAppService = userAppService;
        this.internshipApplicationRepository = internshipApplicationRepository;
        this.interviewRepository = InterviewRepository;
        this.internshipService = internshipService;
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
                employer
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

    public List<InternshipResponseDto> getInternshipsOfEmployer(String email) {
        List<Internship> internships = internshipRepository.findByPostedBy_Credentials_EmailAndDeletedIsFalse(email);
        return internships.stream()
                .map(InternshipResponseDto::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReceivedInternshipApplicationResponseDto> getReceivedInternshipApplications(String email) {
        return internshipApplicationRepository.findByInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(email)
                .stream()
                .map(ReceivedInternshipApplicationResponseDto::of)
                .toList();
    }

    @Transactional
    public CvFileResponseDto openReceivedInternshipApplicationCv(long applicationId, String email) throws InternshipApplicationNotFoundException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        internshipApplication.markAsRead();

        internshipApplicationRepository.save(internshipApplication);

        notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_APPLICATION, applicationId);

        return CvFileResponseDto.of(internshipApplication.getCv());
    }

    public Map<Long, Long> countReceivedInternshipApplicationsByInternship(String email) {
        return internshipRepository.findByPostedBy_Credentials_EmailAndDeletedIsFalse(email)
                .stream()
                .collect(Collectors.toMap(Internship::getId, internshipApplicationRepository::countByInternship));
    }

    @Transactional
    public void createInterview(long applicationId, String email, InterviewRequestDto interviewRequestDto) throws InternshipApplicationNotFoundException, UserNotFoundException, InterviewAlreadyExistsException, ApplicationRejectedException {

        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

        if (internshipApplication.getEmployerDecision() == EmployerDecision.REJECTED) {
            throw new ApplicationRejectedException(applicationId);
        }

        if (interviewRepository.existsByInternshipApplication(internshipApplication)) {
            throw new InterviewAlreadyExistsException(applicationId);
        }


        Employer employer = employerRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);

        Interview interview = new Interview(
                employer,
                internshipApplication,
                interviewRequestDto.message(),
                interviewRequestDto.interviewDate(),
                interviewRequestDto.meetingType(),
                interviewRequestDto.meetingDetails()
        );

        acceptApplication(internshipApplication);

        interviewRepository.save(interview);
    }

    @Transactional
    public void rejectInternshipApplication(long applicationId, String email) throws InternshipApplicationNotFoundException {
        InternshipApplication internshipApplication = findReceivedInternshipApplication(applicationId, email);

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
    public MeetingTypeDTO getMeetingTypes() {
        return MeetingTypeDTO.of(Arrays.asList(MeetingType.values()));
    }

    @Transactional
    public InterviewEmployerResponseDTO updateInterview(long interviewId, String email, InterviewRequestDto interviewRequestDto) throws InterviewNotFoundException, InterviewCancelledException {
        Interview interview = interviewRepository.findByIdAndEmployer_Credentials_Email(interviewId, email)
                .orElseThrow(() -> new InterviewNotFoundException(interviewId));

        if (interview.getInterviewStatus() == InterviewStatus.CANCELLED) {
            throw new InterviewCancelledException(interviewId);
        }

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
    public InterviewEmployerResponseDTO cancelInterview(long interviewId, String email) throws InterviewNotFoundException, InterviewCancelledException {
        Interview interview = interviewRepository.findByIdAndEmployer_Credentials_Email(interviewId, email)
                .orElseThrow(() -> new InterviewNotFoundException(interviewId));

        if (interview.getInterviewStatus() == InterviewStatus.CANCELLED) {
            throw new InterviewCancelledException(interviewId);
        }

        cancelAndSaveInterview(interview);

        return InterviewEmployerResponseDTO.of(interview);
    }

    private void acceptApplication(InternshipApplication internshipApplication) {
        internshipApplication.updateEmployerDecision(EmployerDecision.ACCEPTED);
        internshipApplicationRepository.save(internshipApplication);
    }

    private void cancelInterviewsOfInternship(Internship internship) {
        interviewRepository.findByInternshipApplication_Internship(internship)
                .forEach(this::cancelAndSaveInterview);
    }

    private void cancelAndSaveInterview(Interview interview) {
        interview.cancel();
        interviewRepository.save(interview);
    }

    private void rejectApplication(InternshipApplication internshipApplication) {
        interviewRepository.findByInternshipApplication(internshipApplication)
                .ifPresent(this::cancelAndSaveInterview);
        internshipApplication.updateEmployerDecision(EmployerDecision.REJECTED);
        internshipApplicationRepository.save(internshipApplication);
    }

    private void notifyManagersOfSubmittedInternship(Internship internship) {
        managerRepository.findAll()
                .forEach(manager -> notificationService.notifyIfAbsent(NotificationType.INTERNSHIP_SUBMITTED_FOR_REVIEW, internship.getId(), manager));
    }

    private InternshipApplication findReceivedInternshipApplication(long applicationId, String email) throws InternshipApplicationNotFoundException {
        return internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(applicationId, email)
                .orElseThrow(() -> new InternshipApplicationNotFoundException(applicationId));
    }

    private void closeNewInternshipApplicationNotifications(Internship internship) {
        internshipApplicationRepository.findByInternship(internship)
                .forEach(application -> notificationService.closeNotificationsOfTarget(TargetType.INTERNSHIP_APPLICATION, application.getId()));
    }
}
