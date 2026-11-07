package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.AccountStatus;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.dto.response.user.AccountStatusResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.StudentAccessResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Service
public class AccountAccessService {
    private static final String ACCESS_REQUEST_MESSAGE = "%s %s (%s) signed in after their access expired.";

    private final StudentRepository studentRepository;
    private final ManagerRepository managerRepository;
    private final UserAppRepository userAppRepository;

    private final NotificationService notificationService;
    private final AcademicSessionService academicSessionService;

    public AccountAccessService(StudentRepository studentRepository, ManagerRepository managerRepository, UserAppRepository userAppRepository, NotificationService notificationService, AcademicSessionService academicSessionService) {
        this.studentRepository = studentRepository;
        this.managerRepository = managerRepository;
        this.userAppRepository = userAppRepository;
        this.notificationService = notificationService;
        this.academicSessionService = academicSessionService;
    }

    public AccountStatusResponseDto getAccountStatus(String email) throws UserNotFoundException {
        UserApp user = userAppRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);

        return new AccountStatusResponseDto(getAccountStatus(user));
    }

    public AccountStatus getAccountStatus(UserApp user) {
        if (!(user instanceof Student student)) {
            return AccountStatus.APPROVED;
        }

        if (!academicSessionService.isTargetSession(student.getAccessSession())) {
            return AccountStatus.PENDING;
        }

        return student.getAccountStatus();
    }

    public Collection<? extends GrantedAuthority> getAuthorities(UserApp user) {
        if (getAccountStatus(user) != AccountStatus.APPROVED) {
            return List.of();
        }

        return user.getAuthorities();
    }

    public void notifyManagersIfAccessExpired(String email) {
        studentRepository.findByCredentialsEmail(email)
                .filter(student -> getAccountStatus(student) == AccountStatus.PENDING)
                .ifPresent(this::notifyManagersOfAccessRequest);
    }

    public List<StudentAccessResponseDto> getStudentAccesses() {
        return studentRepository.findAll().stream()
                .map(student -> StudentAccessResponseDto.of(student, getAccountStatus(student)))
                .toList();
    }

    public List<StudentAccessResponseDto> getExpiredStudentAccesses() {
        return getStudentAccesses().stream()
                .filter(studentAccess -> studentAccess.status() == AccountStatus.PENDING)
                .toList();
    }

    @Transactional
    public StudentAccessResponseDto reactivateStudentAccess(long studentId) throws UserNotFoundException {
        Student student = findStudent(studentId);

        student.grantAccess(academicSessionService.getTargetSession());

        return saveAndCloseAccessRequest(student);
    }

    @Transactional
    public StudentAccessResponseDto denyStudentAccess(long studentId) throws UserNotFoundException {
        Student student = findStudent(studentId);

        student.denyAccess(academicSessionService.getTargetSession());

        return saveAndCloseAccessRequest(student);
    }

    private void notifyManagersOfAccessRequest(Student student) {
        String message = String.format(ACCESS_REQUEST_MESSAGE, student.getFirstName(), student.getLastName(), student.getEmail());

        managerRepository.findAll().forEach(manager ->
                notificationService.notifyIfAbsent(NotificationType.STUDENT_ACCESS_REQUESTED, message, student.getId(), manager));
    }

    private StudentAccessResponseDto saveAndCloseAccessRequest(Student student) {
        studentRepository.save(student);

        notificationService.closeNotificationsOfTarget(TargetType.STUDENT_ACCOUNT, student.getId());

        return StudentAccessResponseDto.of(student, student.getAccountStatus());
    }

    private Student findStudent(long studentId) throws UserNotFoundException {
        return studentRepository.findById(studentId).orElseThrow(UserNotFoundException::new);
    }
}
