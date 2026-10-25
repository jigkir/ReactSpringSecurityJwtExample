package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.application.ApplicationRejectedException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.interview.InterviewAlreadyExistsException;
import com.lacouf.rsbjwt.exception.interview.InterviewCancelledException;
import com.lacouf.rsbjwt.exception.interview.InterviewNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.interview.InterviewStatus;
import com.lacouf.rsbjwt.model.interview.MeetingType;
import com.lacouf.rsbjwt.model.interview.StudentDecision;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.interview.InterviewRepository;
import com.lacouf.rsbjwt.repository.users.EmployerRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.interview.InterviewRequestDto;
import com.lacouf.rsbjwt.service.dto.request.signup.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.application.ReceivedInternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.interview.InterviewEmployerResponseDTO;
import com.lacouf.rsbjwt.service.dto.response.interview.MeetingTypeDTO;
import com.lacouf.rsbjwt.service.internship.InternshipService;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.users.EmployerService;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.AdditionalAnswers.answer;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmployerServiceTest {

    @InjectMocks
    private EmployerService employerService;

    @Mock
    private NotificationService notificationService;
    @Mock
    private UserAppService userAppService;

    @Mock
    private EmployerRepository employerRepository;
    @Mock
    private ManagerRepository managerRepository;
    @Mock
    private InternshipRepository internshipRepository;
    @Mock
    private InternshipApplicationRepository internshipApplicationRepository;
    @Mock
    private InterviewRepository interviewRepository;

    @Captor
    private ArgumentCaptor<Employer> employerArgumentCaptor;
    @Captor
    private ArgumentCaptor<Internship> internshipArgumentCaptor;
    @Captor
    private ArgumentCaptor<Interview> interviewArgumentCaptor;

    @Spy
    private InternshipService internshipService;

    private static EmployerSignUpDto employerSignUpDto;
    private static InternshipRequestDto internshipRequestDto;

    private static Employer employer;
    private static Internship internship;

    private static final String EMPLOYER_EMAIL = "email@example.com";
    private static final LocalDate START_DATE = LocalDate.now().plusMonths(4);
    private static final LocalDate APPLICATION_DEADLINE = LocalDate.now().plusMonths(2);
    private static final long INTERNSHIP_APPLICATION_ID = 20L;
    private static final String STUDENT_EMAIL = "student@example.com";

    @BeforeAll
    static void setUp() {
        employerSignUpDto = new EmployerSignUpDto("First Name", "Last Name", EMPLOYER_EMAIL, "Test123@", "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");

        Credentials credentials = Credentials.builder()
                .email(EMPLOYER_EMAIL)
                .password("Test123@-encoded")
                .role(Role.EMPLOYER)
                .build();

        employer = new Employer("First Name", "Last Name", credentials, "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");
        employer.setId(1L);

        internshipRequestDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID, START_DATE, APPLICATION_DEADLINE, new BigDecimal("25.00"), false);

        internship = new Internship("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID, START_DATE, APPLICATION_DEADLINE, new BigDecimal("25.00"), false, employer);
        internship.setId(10L);
    }

    private static InternshipApplication receivedInternshipApplication() {
        Credentials studentCredentials = Credentials.builder().email(STUDENT_EMAIL).password("Test123@-encoded").role(Role.STUDENT).build();
        Student student = new Student("Jane", "Doe", "1234567", studentCredentials, Discipline.COMPUTER_SCIENCE);
        student.setId(3L);

        CV cv = new CV();
        cv.setId(5L);
        cv.setFileName("cv.pdf");

        InternshipApplication internshipApplication = new InternshipApplication(internship, cv, student);
        internshipApplication.setId(INTERNSHIP_APPLICATION_ID);

        return internshipApplication;
    }

    @Test
    void shouldSaveEmployer() throws UserAlreadyExistsException {
        // Arrange
        Credentials credentials = Credentials.builder().email(EMPLOYER_EMAIL).password("Test123@-encoded").role(Role.EMPLOYER).build();

        when(userAppService.createCredentials(EMPLOYER_EMAIL, "Test123@", Role.EMPLOYER)).thenReturn(credentials);
        when(userAppService.formatPhoneNumber("5141234567")).thenReturn("514-123-4567");

        when(employerRepository.save(any(Employer.class)))
                .thenAnswer(answer((Employer employer) -> {
                    employer.setId(1L);
                    return employer;
                }));

        // Act
        employerService.save(employerSignUpDto);

        // Assert
        verify(employerRepository).save(employerArgumentCaptor.capture());

        Employer savedEmployer = employerArgumentCaptor.getValue();
        assert (savedEmployer.getFirstName()).equals("First Name");
        assert (savedEmployer.getLastName()).equals("Last Name");
        assert (savedEmployer.getEmail()).equals(EMPLOYER_EMAIL);
        assert (savedEmployer.getPassword()).equals("Test123@-encoded");
        assert (savedEmployer.getCompanyName()).equals("Company Name");
        assert (savedEmployer.getDiscipline()).equals(Discipline.COMPUTER_SCIENCE);
        assert (savedEmployer.getPhoneNumber()).equals("514-123-4567");
    }

    @Test
    void shouldNotifyAllManagersWhenInternshipIsSubmitted() throws Exception {
        // Arrange
        when(employerRepository.findByCredentialsEmail(EMPLOYER_EMAIL)).thenReturn(Optional.of(employer));

        when(internshipRepository.save(any(Internship.class)))
                .thenAnswer(invocation -> {
                    Internship internship = invocation.getArgument(0);
                    internship.setId(10L);
                    return internship;
                });

        Manager firstManager = new Manager();
        Manager secondManager = new Manager();
        when(managerRepository.findAll()).thenReturn(List.of(firstManager, secondManager));

        // Act
        employerService.saveInternship(internshipRequestDto, EMPLOYER_EMAIL);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.INTERNSHIP_SUBMITTED_FOR_REVIEW, 10L, firstManager);
        verify(notificationService).notifyIfAbsent(NotificationType.INTERNSHIP_SUBMITTED_FOR_REVIEW, 10L, secondManager);
    }

    @Test
    void shouldSaveInternship() throws UserNotFoundException, InvalidInternshipDateException, InvalidCompensationException {
        // Arrange
        when(employerRepository.findByCredentialsEmail(EMPLOYER_EMAIL)).thenReturn(Optional.of(employer));

        when(internshipRepository.save(any(Internship.class)))
                .thenAnswer(invocation -> {
                    Internship internship = invocation.getArgument(0);
                    internship.setId(10L);
                    return internship;
                });

        // Act
        InternshipResponseDto response = employerService.saveInternship(internshipRequestDto, EMPLOYER_EMAIL);

        // Assert
        verify(internshipRepository).save(internshipArgumentCaptor.capture());

        Internship savedInternship = internshipArgumentCaptor.getValue();

        assert (ReviewStatus.PENDING).equals(savedInternship.getStatus());
        assert !savedInternship.isDeleted();
        assert (employer).equals(savedInternship.getPostedBy());

        assert (Long.valueOf(10L)).equals(response.id());
        assert ("Software Developer").equals(response.title());
        assert ("Develop applications").equals(response.description());
        assert ("Java, Spring").equals(response.requiredSkills());
        assert (Integer.valueOf(16)).equals(response.durationInWeeks());
        assert ("Montreal").equals(response.location());
        assert (START_DATE).equals(response.startDate());
        assert (APPLICATION_DEADLINE).equals(response.applicationDeadline());
        assert (new BigDecimal("25.00")).equals(response.compensationAmount());
        assert !response.compensationNegotiable();
        assert (ReviewStatus.PENDING).equals(response.status());
        assert (Long.valueOf(1L)).equals(response.employerId());
    }

    @Test
    void shouldThrowInvalidInternshipDateWhenStartDateIsNotInFuture() {
        // Arrange
        InternshipRequestDto invalidDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID, LocalDate.now(), APPLICATION_DEADLINE, new BigDecimal("25.00"), false);

        // Act
        InvalidInternshipDateException exception = assertThrows(InvalidInternshipDateException.class, () -> employerService.saveInternship(invalidDto, EMPLOYER_EMAIL));

        // Assert
        assert ("Invalid start date. Should be in the future.").equals(exception.getMessage());

        verifyNoInteractions(employerRepository, internshipRepository, managerRepository, notificationService);
    }

    @Test
    void shouldThrowInvalidInternshipDateWhenApplicationDeadlineIsNotInFuture() {
        // Arrange
        InternshipRequestDto invalidDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID, START_DATE, LocalDate.now().minusDays(1), new BigDecimal("25.00"), false);

        // Act
        InvalidInternshipDateException exception = assertThrows(InvalidInternshipDateException.class, () -> employerService.saveInternship(invalidDto, EMPLOYER_EMAIL));

        // Assert
        assert ("Invalid application deadline. Should be in the future.").equals(exception.getMessage());

        verifyNoInteractions(employerRepository, internshipRepository, managerRepository, notificationService);
    }

    @Test
    void shouldSoftDeleteInternship() throws InternshipNotFoundException {
        // Arrange
        when(internshipRepository.findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(10L, EMPLOYER_EMAIL)).thenReturn(Optional.of(internship));
        when(internshipApplicationRepository.findByInternship(internship)).thenReturn(List.of(receivedInternshipApplication()));

        // Act
        employerService.deleteInternship(10L, EMPLOYER_EMAIL);

        // Assert
        assert internship.isDeleted();

        verify(internshipRepository).save(internship);
        verify(notificationService).closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, 10L);
        verify(notificationService).closeNotificationsOfTarget(TargetType.INTERNSHIP_APPLICATION, INTERNSHIP_APPLICATION_ID);
    }

    @Test
    void shouldReturnInternshipsOfEmployer() {
        // Arrange
        when(internshipRepository.findByPostedBy_Credentials_EmailAndDeletedIsFalse(EMPLOYER_EMAIL)).thenReturn(List.of(internship));

        // Act
        List<InternshipResponseDto> response = employerService.getInternshipsOfEmployer(EMPLOYER_EMAIL);

        // Assert
        assert (Integer.valueOf(1)).equals(response.size());
        assert (Long.valueOf(10L)).equals(response.getFirst().id());
        assert ("Software Developer").equals(response.getFirst().title());
        assert (Long.valueOf(1L)).equals(response.getFirst().employerId());
    }

    @Test
    void shouldThrowInvalidCompensationWhenAmountIsMissingAndNotNegotiable() {
        // Arrange
        InternshipRequestDto invalidDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID, START_DATE, APPLICATION_DEADLINE, null, false);

        // Act + Assert
        assertThrows(InvalidCompensationException.class, () -> employerService.saveInternship(invalidDto, EMPLOYER_EMAIL));

        verifyNoInteractions(employerRepository, internshipRepository, managerRepository, notificationService);
    }

    @Test
    void shouldSaveInternshipWithoutAmountWhenNegotiable() throws Exception {
        // Arrange
        InternshipRequestDto negotiableDto = new InternshipRequestDto("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID, START_DATE, APPLICATION_DEADLINE, null, true);

        when(employerRepository.findByCredentialsEmail(EMPLOYER_EMAIL)).thenReturn(Optional.of(employer));
        when(internshipRepository.save(any(Internship.class))).thenAnswer(invocation -> {
            Internship saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        // Act
        InternshipResponseDto response = employerService.saveInternship(negotiableDto, EMPLOYER_EMAIL);

        // Assert
        assert (response.compensationAmount() == null);
        assert response.compensationNegotiable();

        verify(internshipRepository).save(any(Internship.class));
    }

    @Test
    void shouldUpdateInternship() throws Exception {
        // Arrange
        internship.approve();

        when(internshipRepository.findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(10L, EMPLOYER_EMAIL))
                .thenReturn(Optional.of(internship));

        Manager firstManager = new Manager();
        Manager secondManager = new Manager();
        when(managerRepository.findAll()).thenReturn(List.of(firstManager, secondManager));

        // Act
        InternshipResponseDto response = employerService.updateInternship(10L, internshipRequestDto, EMPLOYER_EMAIL);

        // Assert
        assert (Long.valueOf(10L)).equals(response.id());
        assert ("Software Developer").equals(response.title());
        assert (ReviewStatus.PENDING).equals(response.status());

        verify(notificationService).closeNotificationsOfTarget(TargetType.INTERNSHIP_OFFER, 10L);
        verify(internshipRepository).save(internship);
        verify(notificationService).notifyIfAbsent(NotificationType.INTERNSHIP_SUBMITTED_FOR_REVIEW, 10L, firstManager);
        verify(notificationService).notifyIfAbsent(NotificationType.INTERNSHIP_SUBMITTED_FOR_REVIEW, 10L, secondManager);
    }

    @Test
    void shouldReturnReceivedInternshipApplicationsWhenEmployerHasApplications() {
        // Arrange
        when(internshipApplicationRepository.findByInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(EMPLOYER_EMAIL))
                .thenReturn(List.of(receivedInternshipApplication()));

        // Act
        List<ReceivedInternshipApplicationResponseDto> internshipApplications = employerService.getReceivedInternshipApplications(EMPLOYER_EMAIL);

        // Assert
        ReceivedInternshipApplicationResponseDto internshipApplication = internshipApplications.getFirst();

        assert (Integer.valueOf(1)).equals(internshipApplications.size());
        assert (Long.valueOf(10L)).equals(internshipApplication.internshipId());
        assert (STUDENT_EMAIL).equals(internshipApplication.student().email());
        assert (Discipline.COMPUTER_SCIENCE).equals(internshipApplication.student().discipline());
        assert (InternshipApplicationStatus.UNREAD).equals(internshipApplication.internshipApplicationStatus());
    }

    @Test
    void shouldMarkApplicationAsReadWhenEmployerOpensCv() throws InternshipApplicationNotFoundException {
        // Arrange
        InternshipApplication internshipApplication = receivedInternshipApplication();

        when(internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL))
                .thenReturn(Optional.of(internshipApplication));

        // Act
        CvFileResponseDto cv = employerService.openReceivedInternshipApplicationCv(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL);

        // Assert
        assert (InternshipApplicationStatus.READ).equals(internshipApplication.getInternshipApplicationStatus());
        assert ("cv.pdf").equals(cv.fileName());

        verify(internshipApplicationRepository).save(internshipApplication);
        verify(notificationService).closeNotificationsOfTarget(TargetType.INTERNSHIP_APPLICATION, INTERNSHIP_APPLICATION_ID);
    }

    @Test
    void shouldCountReceivedInternshipApplicationsOfEachInternshipWhenEmployerHasApplications() {
        // Arrange
        when(internshipRepository.findByPostedBy_Credentials_EmailAndDeletedIsFalse(EMPLOYER_EMAIL)).thenReturn(List.of(internship));
        when(internshipApplicationRepository.countByInternship(internship)).thenReturn(2L);

        // Act
        Map<Long, Long> counts = employerService.countReceivedInternshipApplicationsByInternship(EMPLOYER_EMAIL);

        // Assert
        assert (Map.of(10L, 2L)).equals(counts);
    }

    @Test
    void shouldCreateInterview() throws Exception {
        // Arrange
        LocalDateTime interviewDate = LocalDateTime.now().plusDays(7);
        InternshipApplication internshipApplication = receivedInternshipApplication();

        when(internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL))
                .thenReturn(Optional.of(internshipApplication));

        // Act
        employerService.createInterview(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL, new InterviewRequestDto("Please come to our office", interviewDate, MeetingType.IN_PERSON, "123 Main St"));

        // Assert
        verify(interviewRepository).save(interviewArgumentCaptor.capture());

        Interview savedInterview = interviewArgumentCaptor.getValue();
        assert (employer).equals(savedInterview.getEmployer());
        assert (internshipApplication).equals(savedInterview.getInternshipApplication());
        assert ("Please come to our office").equals(savedInterview.getMessage());
        assert (interviewDate).equals(savedInterview.getInterviewDate());
        assert (StudentDecision.PENDING).equals(savedInterview.getStudentDecision());
        assert (InterviewStatus.SCHEDULED).equals(savedInterview.getInterviewStatus());
        assert (EmployerDecision.INTERVIEW_OFFERED).equals(savedInterview.getInternshipApplication().getEmployerDecision());

        verify(internshipApplicationRepository).save(internshipApplication);
    }

    @Test
    void shouldThrowWhenCreatingInterviewForUnknownApplication() {
        // Arrange
        when(internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL))
                .thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(InternshipApplicationNotFoundException.class,
                () -> employerService.createInterview(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL, new InterviewRequestDto("Message", LocalDateTime.now().plusDays(7), MeetingType.IN_PERSON, "123 Main St")));

        verifyNoInteractions(interviewRepository);
    }

    @Test
    void shouldReturnInterviewsOfEmployer() {
        // Arrange
        LocalDateTime interviewDate = LocalDateTime.now().plusDays(7);
        Interview interview = new Interview(employer, receivedInternshipApplication(), "Please come to our office", interviewDate, MeetingType.IN_PERSON, "123 Main St");
        interview.setId(30L);

        when(interviewRepository.findByEmployer_Credentials_EmailAndInternshipApplication_Internship_DeletedFalse(EMPLOYER_EMAIL))
                .thenReturn(List.of(interview));
        // Act
        List<InterviewEmployerResponseDTO> response = employerService.getInterviewsOfEmployer(EMPLOYER_EMAIL);

        // Assert
        assert (Integer.valueOf(1)).equals(response.size());

        InterviewEmployerResponseDTO first = response.getFirst();
        assert (Long.valueOf(30L)).equals(first.id());
        assert ("Jane Doe").equals(first.studentName());
        assert ("Software Developer").equals(first.internshipTitle());
        assert ("Please come to our office").equals(first.message());
        assert ("PENDING").equals(first.studentDecision());
        assert (interviewDate.toString()).equals(first.interviewDate());
    }

    @Test
    void shouldReturnMeetingTypes() {
        // Act
        MeetingTypeDTO result = employerService.getMeetingTypes();

        // Assert
        assertEquals(List.of("ONLINE", "IN_PERSON", "PHONE"), result.meetingTypes());
    }

    @Test
    void shouldUpdateInterview() throws Exception {
        // Arrange
        Interview interview = new Interview(employer, receivedInternshipApplication(), "Old message", LocalDateTime.now().plusDays(3), MeetingType.ONLINE, "old-link");
        interview.setId(30L);

        LocalDateTime newDate = LocalDateTime.now().plusDays(10);

        when(interviewRepository.findByIdAndEmployer_Credentials_Email(30L, EMPLOYER_EMAIL)).thenReturn(Optional.of(interview));

        // Act
        InterviewEmployerResponseDTO response = employerService.updateInterview(30L, EMPLOYER_EMAIL, new InterviewRequestDto("New message", newDate, MeetingType.IN_PERSON, "123 Main St"));

        // Assert
        assertEquals("New message", interview.getMessage());
        assertEquals(newDate, interview.getInterviewDate());
        assertEquals(MeetingType.IN_PERSON, interview.getMeetingType());
        assertEquals("123 Main St", interview.getMeetingDetails());
        assertEquals(StudentDecision.PENDING, interview.getStudentDecision());

        assertEquals(30L, response.id());
        assertEquals("New message", response.message());
        assertEquals(newDate.toString(), response.interviewDate());

        verify(interviewRepository).save(interview);
    }

    @Test
    void shouldThrowWhenUpdatingUnknownInterview() {
        // Arrange
        when(interviewRepository.findByIdAndEmployer_Credentials_Email(30L, EMPLOYER_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(InterviewNotFoundException.class,
                () -> employerService.updateInterview(30L, EMPLOYER_EMAIL, new InterviewRequestDto("Message", LocalDateTime.now().plusDays(7), MeetingType.IN_PERSON, "123 Main St")));

        verify(interviewRepository, never()).save(any(Interview.class));
    }

    @Test
    void shouldThrowWhenCreatingInterviewForRejectedApplication() {
        // Arrange
        InternshipApplication internshipApplication = receivedInternshipApplication();
        internshipApplication.updateEmployerDecision(EmployerDecision.REJECTED);

        when(internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL))
                .thenReturn(Optional.of(internshipApplication));

        // Act + Assert
        assertThrows(ApplicationRejectedException.class,
                () -> employerService.createInterview(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL, new InterviewRequestDto("Message", LocalDateTime.now().plusDays(7), MeetingType.IN_PERSON, "123 Main St")));

        verify(interviewRepository, never()).save(any(Interview.class));
    }

    @Test
    void shouldThrowWhenCreatingInterviewThatAlreadyExists() {
        // Arrange
        InternshipApplication internshipApplication = receivedInternshipApplication();

        when(internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL))
                .thenReturn(Optional.of(internshipApplication));
        when(interviewRepository.existsByInternshipApplication(internshipApplication)).thenReturn(true);

        // Act + Assert
        assertThrows(InterviewAlreadyExistsException.class,
                () -> employerService.createInterview(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL, new InterviewRequestDto("Message", LocalDateTime.now().plusDays(7), MeetingType.IN_PERSON, "123 Main St")));

        verify(interviewRepository, never()).save(any(Interview.class));
    }

    @Test
    void shouldRejectApplicationWithoutInterview() throws Exception {
        // Arrange
        InternshipApplication internshipApplication = receivedInternshipApplication();

        when(internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL))
                .thenReturn(Optional.of(internshipApplication));
        when(interviewRepository.findByInternshipApplication(internshipApplication)).thenReturn(Optional.empty());

        // Act
        employerService.rejectInternshipApplication(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL);

        // Assert
        assertEquals(EmployerDecision.REJECTED, internshipApplication.getEmployerDecision());

        verify(internshipApplicationRepository).save(internshipApplication);
        verify(interviewRepository, never()).save(any(Interview.class));
    }

    @Test
    void shouldCancelInterviewWhenApplicationIsRejected() throws Exception {
        // Arrange
        InternshipApplication internshipApplication = receivedInternshipApplication();
        Interview interview = new Interview(employer, internshipApplication, "Message", LocalDateTime.now().plusDays(7), MeetingType.ONLINE, "link");

        when(internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL))
                .thenReturn(Optional.of(internshipApplication));
        when(interviewRepository.findByInternshipApplication(internshipApplication)).thenReturn(Optional.of(interview));

        // Act
        employerService.rejectInternshipApplication(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL);

        // Assert
        assertEquals(EmployerDecision.REJECTED, internshipApplication.getEmployerDecision());
        assertEquals(InterviewStatus.CANCELLED, interview.getInterviewStatus());

        verify(interviewRepository).save(interview);
        verify(internshipApplicationRepository).save(internshipApplication);
    }

    @Test
    void shouldThrowWhenRejectingUnknownApplication() {
        // Arrange
        when(internshipApplicationRepository.findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL))
                .thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(InternshipApplicationNotFoundException.class,
                () -> employerService.rejectInternshipApplication(INTERNSHIP_APPLICATION_ID, EMPLOYER_EMAIL));

        verifyNoInteractions(interviewRepository);
    }

    @Test
    void shouldCancelInterview() throws Exception {
        // Arrange
        Interview interview = new Interview(employer, receivedInternshipApplication(), "Message", LocalDateTime.now().plusDays(7), MeetingType.ONLINE, "link");
        interview.setId(30L);

        when(interviewRepository.findByIdAndEmployer_Credentials_Email(30L, EMPLOYER_EMAIL)).thenReturn(Optional.of(interview));

        // Act
        InterviewEmployerResponseDTO response = employerService.cancelInterview(30L, EMPLOYER_EMAIL);

        // Assert
        assertEquals(InterviewStatus.CANCELLED, interview.getInterviewStatus());
        assertEquals(30L, response.id());

        verify(interviewRepository).save(interview);
    }

    @Test
    void shouldThrowWhenCancellingUnknownInterview() {
        // Arrange
        when(interviewRepository.findByIdAndEmployer_Credentials_Email(30L, EMPLOYER_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(InterviewNotFoundException.class, () -> employerService.cancelInterview(30L, EMPLOYER_EMAIL));

        verify(interviewRepository, never()).save(any(Interview.class));
    }

    @Test
    void shouldThrowWhenCancellingAlreadyCancelledInterview() {
        // Arrange
        Interview interview = new Interview(employer, receivedInternshipApplication(), "Message", LocalDateTime.now().plusDays(7), MeetingType.ONLINE, "link");
        interview.cancel();

        when(interviewRepository.findByIdAndEmployer_Credentials_Email(30L, EMPLOYER_EMAIL)).thenReturn(Optional.of(interview));

        // Act + Assert
        assertThrows(InterviewCancelledException.class, () -> employerService.cancelInterview(30L, EMPLOYER_EMAIL));

        verify(interviewRepository, never()).save(any(Interview.class));
    }

    @Test
    void shouldThrowWhenUpdatingCancelledInterview() {
        // Arrange
        Interview interview = new Interview(employer, receivedInternshipApplication(), "Message", LocalDateTime.now().plusDays(7), MeetingType.ONLINE, "link");
        interview.cancel();

        when(interviewRepository.findByIdAndEmployer_Credentials_Email(30L, EMPLOYER_EMAIL)).thenReturn(Optional.of(interview));

        // Act + Assert
        assertThrows(InterviewCancelledException.class,
                () -> employerService.updateInterview(30L, EMPLOYER_EMAIL, new InterviewRequestDto("New", LocalDateTime.now().plusDays(10), MeetingType.IN_PERSON, "123 Main St")));

        assertEquals("Message", interview.getMessage());
        verify(interviewRepository, never()).save(any(Interview.class));
    }

    @Test
    void shouldCancelInterviewsWhenInternshipIsDeleted() throws InternshipNotFoundException {
        // Arrange
        Interview interview = new Interview(employer, receivedInternshipApplication(), "Message", LocalDateTime.now().plusDays(7), MeetingType.ONLINE, "link");

        when(internshipRepository.findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(10L, EMPLOYER_EMAIL)).thenReturn(Optional.of(internship));
        when(interviewRepository.findByInternshipApplication_Internship(internship)).thenReturn(List.of(interview));

        // Act
        employerService.deleteInternship(10L, EMPLOYER_EMAIL);

        // Assert
        assertEquals(InterviewStatus.CANCELLED, interview.getInterviewStatus());

        verify(interviewRepository).save(interview);
    }

}
