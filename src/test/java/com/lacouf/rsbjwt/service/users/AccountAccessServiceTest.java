package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.AccountStatus;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.dto.response.user.AccountStatusResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.StudentAccessResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountAccessServiceTest {
    private static final String STUDENT_EMAIL = "marie@claurendeau.qc.ca";
    private static final String ACCESS_REQUEST_MESSAGE = "Marie Tremblay (marie@claurendeau.qc.ca) signed in after their access expired.";

    @InjectMocks
    private AccountAccessService accountAccessService;

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private ManagerRepository managerRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private AcademicSessionService academicSessionService;

    private Student student;
    private AcademicSession currentSession;
    private AcademicSession pastSession;

    @BeforeEach
    void setUp() {
        student = new Student("Marie", "Tremblay", "2234567", Credentials.builder().email(STUDENT_EMAIL).role(Role.STUDENT).build(), Discipline.COMPUTER_SCIENCE, null);
        student.setId(2L);

        currentSession = new AcademicSession(Season.FALL, 2026);
        currentSession.setId(1L);

        pastSession = new AcademicSession(Season.SUMMER, 2026);
        pastSession.setId(2L);
    }

    @Test
    void shouldBeApprovedWhenUserIsNotStudent() {
        // Arrange
        Employer employer = new Employer("Jean", "Dupont", Credentials.builder().email("employer@example.com").role(Role.EMPLOYER).build(), "Tech Corp", Discipline.COMPUTER_SCIENCE, "5141234567");

        // Act
        AccountStatus status = accountAccessService.getAccountStatus(employer);

        // Assert
        assert (AccountStatus.APPROVED).equals(status);

        verifyNoInteractions(academicSessionService);
    }

    @Test
    void shouldBeApprovedWhenStudentAccessIsForCurrentSession() {
        // Arrange
        student.grantAccess(currentSession);

        when(academicSessionService.isInCurrentAcademicYear(currentSession)).thenReturn(true);

        // Act + Assert
        assert (AccountStatus.APPROVED).equals(accountAccessService.getAccountStatus(student));
    }

    @Test
    void shouldBePendingWhenStudentAccessIsFromPastSession() {
        // Arrange
        student.grantAccess(pastSession);

        when(academicSessionService.isInCurrentAcademicYear(pastSession)).thenReturn(false);

        // Act + Assert
        assert (AccountStatus.PENDING).equals(accountAccessService.getAccountStatus(student));
    }

    @Test
    void shouldBeRejectedWhenManagerDeniedAccessForCurrentSession() {
        // Arrange
        student.denyAccess(currentSession);

        when(academicSessionService.isInCurrentAcademicYear(currentSession)).thenReturn(true);

        // Act + Assert
        assert (AccountStatus.REJECTED).equals(accountAccessService.getAccountStatus(student));
    }

    @Test
    void shouldReturnAccountStatusWhenEmailExists() throws UserNotFoundException {
        // Arrange
        student.grantAccess(pastSession);

        when(userAppRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(academicSessionService.isInCurrentAcademicYear(pastSession)).thenReturn(false);

        // Act
        AccountStatusResponseDto response = accountAccessService.getAccountStatus(STUDENT_EMAIL);

        // Assert
        assert (AccountStatus.PENDING).equals(response.status());
    }

    @Test
    void shouldGiveRoleWhenStudentIsActive() {
        // Arrange
        student.grantAccess(currentSession);

        when(academicSessionService.isInCurrentAcademicYear(currentSession)).thenReturn(true);

        // Act + Assert
        assert (student.getAuthorities()).equals(accountAccessService.getAuthorities(student));
    }

    @Test
    void shouldNotifyEveryManagerWhenStudentSignsInAfterAccessExpired() {
        // Arrange
        Manager firstManager = new Manager();
        Manager secondManager = new Manager();

        student.grantAccess(pastSession);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(academicSessionService.isInCurrentAcademicYear(pastSession)).thenReturn(false);
        when(managerRepository.findAll()).thenReturn(List.of(firstManager, secondManager));

        // Act
        accountAccessService.notifyManagersIfAccessExpired(STUDENT_EMAIL);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.STUDENT_ACCESS_REQUESTED, ACCESS_REQUEST_MESSAGE, 2L, firstManager);
        verify(notificationService).notifyIfAbsent(NotificationType.STUDENT_ACCESS_REQUESTED, ACCESS_REQUEST_MESSAGE, 2L, secondManager);
    }

    @Test
    void shouldNotNotifyManagersWhenStudentIsActive() {
        // Arrange
        student.grantAccess(currentSession);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(academicSessionService.isInCurrentAcademicYear(currentSession)).thenReturn(true);

        // Act
        accountAccessService.notifyManagersIfAccessExpired(STUDENT_EMAIL);

        // Assert
        verifyNoInteractions(managerRepository, notificationService);
    }

    @Test
    void shouldNotNotifyManagersAgainWhenAccessWasDenied() {
        // Arrange
        student.denyAccess(currentSession);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(academicSessionService.isInCurrentAcademicYear(currentSession)).thenReturn(true);

        // Act
        accountAccessService.notifyManagersIfAccessExpired(STUDENT_EMAIL);

        // Assert
        verifyNoInteractions(managerRepository, notificationService);
    }

    @Test
    void shouldNotNotifyManagersWhenUserIsNotStudent() {
        // Arrange
        when(studentRepository.findByCredentialsEmail("employer@example.com")).thenReturn(Optional.empty());

        // Act
        accountAccessService.notifyManagersIfAccessExpired("employer@example.com");

        // Assert
        verifyNoInteractions(managerRepository, notificationService);
    }

    @Test
    void shouldReturnStatusOfEveryStudent() {
        // Arrange
        student.grantAccess(pastSession);

        when(studentRepository.findAll()).thenReturn(List.of(student));
        when(academicSessionService.isInCurrentAcademicYear(pastSession)).thenReturn(false);

        // Act
        List<StudentAccessResponseDto> studentAccesses = accountAccessService.getStudentAccesses();

        // Assert
        assert (Integer.valueOf(1)).equals(studentAccesses.size());
        assert (STUDENT_EMAIL).equals(studentAccesses.getFirst().email());
        assert (AccountStatus.PENDING).equals(studentAccesses.getFirst().status());
    }

    @Test
    void shouldReturnOnlyExpiredStudentsWhenGettingExpiredStudentAccesses() {
        // Arrange
        Student activeStudent = new Student("Luc", "Gagnon", "3234567", Credentials.builder().email("luc@example.com").role(Role.STUDENT).build(), Discipline.COMPUTER_SCIENCE, currentSession);
        activeStudent.setId(3L);
        student.grantAccess(pastSession);

        when(studentRepository.findAll()).thenReturn(List.of(student, activeStudent));
        when(academicSessionService.isInCurrentAcademicYear(pastSession)).thenReturn(false);
        when(academicSessionService.isInCurrentAcademicYear(currentSession)).thenReturn(true);

        // Act
        List<StudentAccessResponseDto> expiredStudentAccesses = accountAccessService.getExpiredStudentAccesses();

        // Assert
        assert (Integer.valueOf(1)).equals(expiredStudentAccesses.size());
        assert (STUDENT_EMAIL).equals(expiredStudentAccesses.getFirst().email());
    }

    @Test
    void shouldReactivateStudentAccessForCurrentSession() throws UserNotFoundException {
        // Arrange
        student.grantAccess(pastSession);

        when(studentRepository.findById(2L)).thenReturn(Optional.of(student));
        when(academicSessionService.getCurrentSession()).thenReturn(currentSession);

        // Act
        StudentAccessResponseDto response = accountAccessService.reactivateStudentAccess(2L);

        // Assert
        assert (AccountStatus.APPROVED).equals(response.status());
        assert (currentSession).equals(student.getAccessSession());

        verify(studentRepository).save(student);
        verify(notificationService).closeNotificationsOfTarget(TargetType.STUDENT_ACCOUNT, 2L);
    }

    @Test
    void shouldDenyStudentAccessForCurrentSession() throws UserNotFoundException {
        // Arrange
        student.grantAccess(pastSession);

        when(studentRepository.findById(2L)).thenReturn(Optional.of(student));
        when(academicSessionService.getCurrentSession()).thenReturn(currentSession);

        // Act
        StudentAccessResponseDto response = accountAccessService.denyStudentAccess(2L);

        // Assert
        assert (AccountStatus.REJECTED).equals(response.status());
        assert (currentSession).equals(student.getAccessSession());

        verify(studentRepository).save(student);
        verify(notificationService).closeNotificationsOfTarget(TargetType.STUDENT_ACCOUNT, 2L);
    }
}