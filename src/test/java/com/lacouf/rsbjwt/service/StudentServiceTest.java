package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.response.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.request.StudentSignUpDto;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.answer;
import static org.mockito.Mockito.*;

import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class StudentServiceTest {

    @InjectMocks
    private StudentService studentService;

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private CVRepository cvRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private ManagerRepository managerRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Notification> notificationArgumentCaptor;

    @Captor
    private ArgumentCaptor<Student> studentArgumentCaptor;

    @Captor
    private ArgumentCaptor<CV> cvArgumentCaptor;

    private static StudentSignUpDto studentSignUpDto;
    private Student dummyStudent;
    private static byte[] validPdfBytes;

    @BeforeAll
    static void createStudentSignUpDto() throws IOException {
        studentSignUpDto = new StudentSignUpDto("First Name", "Last Name", "1234567", "test@claurendeau.qc.ca", "Test123@", Discipline.COMPUTER_SCIENCE);

        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            doc.addPage(new PDPage());
            doc.save(baos);
            validPdfBytes = baos.toByteArray();
        }
    }

    @BeforeEach
    void setUp() {
        dummyStudent = new Student(
                "First Name", "Last Name", "1234567",
                Credentials.builder().email("test@claurendeau.qc.ca").role(Role.STUDENT).build(),
                Discipline.COMPUTER_SCIENCE
        );
        dummyStudent.setId(1L);
    }

    private static String calculateHash(byte[] bytes) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(bytes);
        return HexFormat.of().formatHex(hashBytes);
    }

    // ==========================================
    // Student Save & Find Tests
    // ==========================================

    @Test
    void shouldSaveStudent() throws UserAlreadyExistsException {
        when(passwordEncoder.encode("Test123@")).thenReturn("Test123@-encoded");

        when(studentRepository.save(any(Student.class)))
                .thenAnswer(answer((Student student) -> {
                    student.setId(1L);
                    return student;
                }));

        studentService.save(studentSignUpDto);

        verify(studentRepository).save(studentArgumentCaptor.capture());

        Student student = studentArgumentCaptor.getValue();

        assert student.getFirstName().equals("First Name");
        assert student.getLastName().equals("Last Name");
        assert student.getStudentId().equals("1234567");
        assert student.getEmail().equals("test@claurendeau.qc.ca");
        assert student.getPassword().equals("Test123@-encoded");
        assert student.getDiscipline().equals(Discipline.COMPUTER_SCIENCE);
    }

    @Test
    void shouldThrowUserAlreadyExistsExceptionWhenStudentIdAlreadyUsed() {
        when(studentRepository.findByStudentId(studentSignUpDto.studentId())).thenReturn(Optional.of(new Student()));

        UserAlreadyExistsException exception = assertThrows(
                UserAlreadyExistsException.class,
                () -> studentService.save(studentSignUpDto)
        );

        assert "studentId".equals(exception.getField());
        assert "user already exists".equals(exception.getMessage());

        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    void shouldThrowUserAlreadyExistsExceptionWhenEmailAlreadyUsed() {
        when(userAppRepository.findByCredentialsEmail(studentSignUpDto.email())).thenReturn(Optional.of(new Student()));

        UserAlreadyExistsException exception = assertThrows(
                UserAlreadyExistsException.class,
                () -> studentService.save(studentSignUpDto)
        );

        assert "email".equals(exception.getField());
        assert "user already exists".equals(exception.getMessage());

        verify(studentRepository, never()).save(any(Student.class));
    }

    // ==========================================
    // CV Tests
    // ==========================================

    @Test
    void shouldSaveCVSuccessfully() throws Exception {
        CvUploadDto upload = new CvUploadDto(validPdfBytes, "cv.pdf");

        studentService.saveCV(upload, dummyStudent);

        verify(cvRepository).save(cvArgumentCaptor.capture());
        CV savedCv = cvArgumentCaptor.getValue();

        assert "cv.pdf".equals(savedCv.getFileName());
        assert dummyStudent.equals(savedCv.getStudent());
        assert savedCv.getUploadDate() != null;
        assert calculateHash(validPdfBytes).equals(savedCv.getFileHash());
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenContentIsNull() {
        CvUploadDto upload = new CvUploadDto(null, "cv.pdf");

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );

        assert "File content cannot be null or empty.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenContentIsEmpty() {
        CvUploadDto upload = new CvUploadDto(new byte[0], "cv.pdf");

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );

        assert "File content cannot be null or empty.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowInvalidFileSizeExceptionWhenFileExceedsMaxSize() {
        CvUploadDto upload = new CvUploadDto(new byte[2 * 1024 * 1024 + 1], "large.pdf");

        assertThrows(
                InvalidFileSizeException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenMimeTypeIsNotPdf() {
        CvUploadDto upload = new CvUploadDto("Hello World".getBytes(), "file.txt");

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );

        assert "Invalid file type. Only PDF files are allowed.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenPdfIsCorrupted() {
        CvUploadDto upload = new CvUploadDto("%PDF-1.4 Fake PDF Content That Cannot Be Parsed".getBytes(), "corrupted.pdf");

        assertThrows(
                CorruptedFileException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );
    }

    // ==========================================
    // CV Retrieval & Check Tests
    // ==========================================

    @Test
    void shouldReturnTrueWhenIsCVReadable() throws NoSuchAlgorithmException {
        CV cv = new CV();
        cv.setContent(validPdfBytes);
        cv.setFileHash(calculateHash(validPdfBytes));

        boolean readable = studentService.isCVReadable(cv);

        assert readable;
    }

    @Test
    void shouldReturnFalseWhenIsCVReadableHasMismatchedHash() throws NoSuchAlgorithmException {
        CV cv = new CV();
        cv.setContent(validPdfBytes);
        cv.setFileHash("invalid_hash_string");

        boolean readable = studentService.isCVReadable(cv);

        assert !readable;
    }

    @Test
    void shouldReturnFalseWhenIsCVReadableHasCorruptedContent() throws NoSuchAlgorithmException {
        byte[] fakeBytes = "Corrupted Data".getBytes();
        CV cv = new CV();
        cv.setContent(fakeBytes);
        cv.setFileHash(calculateHash(fakeBytes));

        boolean readable = studentService.isCVReadable(cv);

        assert !readable;
    }

    @Test
    void shouldGetCVCountByStudent() throws UserNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.countByStudentAndVisibility(dummyStudent, CvVisibility.VISIBLE)).thenReturn(3L);

        long count = studentService.getCVCountByStudentId(dummyStudent.getId());

        assert count == 3L;
    }

    @Test
    void shouldGetCVsSuccessfully() throws Exception {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV visibleCv = new CV();
        visibleCv.setId(1L);
        visibleCv.setContent(validPdfBytes);
        visibleCv.setFileHash(calculateHash(validPdfBytes));
        visibleCv.setVisibility(CvVisibility.VISIBLE);

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(visibleCv));

        List<StudentCvResponseDto> cvs = studentService.getCVs(dummyStudent.getId());

        assert cvs.size() == 1;
        assert Long.valueOf(1L).equals(cvs.get(0).id());
    }

    @Test
    void shouldSkipHiddenCVsWhenGettingCVs() throws Exception {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV hiddenCv = new CV();
        hiddenCv.setId(1L);
        hiddenCv.setContent(validPdfBytes);
        hiddenCv.setFileHash(calculateHash(validPdfBytes));
        hiddenCv.setVisibility(CvVisibility.HIDDEN);

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(hiddenCv));

        List<StudentCvResponseDto> cvs = studentService.getCVs(dummyStudent.getId());

        assert cvs.isEmpty();
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenGettingCVsWithCorruptedFile() throws Exception {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV corruptedCv = new CV();
        corruptedCv.setId(2L);
        corruptedCv.setContent("Corrupted".getBytes());
        corruptedCv.setFileHash("badhash");

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(corruptedCv));

        assertThrows(CorruptedFileException.class, () -> studentService.getCVs(dummyStudent.getId()));
    }

    @Test
    void shouldGetMaxCVSize() {
        assert Integer.valueOf(2 * 1024 * 1024).equals(studentService.getMaxCVSize());
    }

    // ==========================================
    // Visibility & Sharing Scope Tests
    // ==========================================

    @Test
    void shouldSetCvAsInvisible() throws UserNotFoundException, CvNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setVisibility(CvVisibility.VISIBLE);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        studentService.setCvAsInvisible(dummyStudent.getId(), 10L);

        assert CvVisibility.HIDDEN.equals(cv.getVisibility());
        verify(cvRepository).save(cv);
        verify(notificationRepository).markAllAsReadByTargetTypeAndTargetId(TargetType.CV, 10L);
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingInvisibleForDifferentStudent() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        Student existingStudent = new Student();
        existingStudent.setStudentId("9999999");

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(existingStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(CvNotFoundException.class, () -> studentService.setCvAsInvisible(dummyStudent.getId(), 10L));
    }

    @Test
    void shouldSetCvAsPublic() throws UserNotFoundException, CVAlreadyPublicException, CvNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PRIVATE);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        studentService.setCvAsPublic(dummyStudent.getId(), 10L);

        assert CVSharingScope.PUBLIC.equals(cv.getSharingScope());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCVAlreadyPublicExceptionWhenCvIsAlreadyPublic() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PUBLIC);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(CVAlreadyPublicException.class, () -> studentService.setCvAsPublic(dummyStudent.getId(), 10L));
    }

    @Test
    void shouldSetCvAsPrivate() throws UserNotFoundException, CVAlreadyPrivateException, CvNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PUBLIC);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        studentService.setCvAsPrivate(dummyStudent.getId(), 10L);

        assert CVSharingScope.PRIVATE.equals(cv.getSharingScope());
        verify(cvRepository).save(cv);
        verify(notificationRepository).markAllAsReadByTargetTypeAndTargetId(TargetType.CV, 10L);
    }

    @Test
    void shouldThrowCVAlreadyPrivateExceptionWhenCvIsAlreadyPrivate() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PRIVATE);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(CVAlreadyPrivateException.class, () -> studentService.setCvAsPrivate(dummyStudent.getId(), 10L));
    }

    @Test
    void shouldSetCVAsSecondary() throws UserNotFoundException, CvNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setPriority(CvPriority.MAIN);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        studentService.setCVAsSecondary(dummyStudent.getId(), 10L);

        assert CvPriority.SECONDARY.equals(cv.getPriority());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingSecondaryForDifferentStudent() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        Student otherStudent = new Student();
        otherStudent.setId(99L);

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(otherStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsSecondary(dummyStudent.getId(), 10L));
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingSecondaryForNonExistentCv() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsSecondary(dummyStudent.getId(), 999L));
    }

    @Test
    void shouldSetCVAsMainWhenNoExistingMainCv() throws UserNotFoundException, CvNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setPriority(CvPriority.SECONDARY);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));
        when(cvRepository.findByStudentAndPriority(dummyStudent, CvPriority.MAIN)).thenReturn(null);

        studentService.setCVAsMain(dummyStudent.getId(), 10L);

        assert CvPriority.MAIN.equals(cv.getPriority());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldDemoteExistingMainCvAndPromoteNewCvToMain() throws UserNotFoundException, CvNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV targetCv = new CV();
        targetCv.setId(10L);
        targetCv.setStudent(dummyStudent);
        targetCv.setPriority(CvPriority.SECONDARY);

        CV currentMainCv = new CV();
        currentMainCv.setId(5L);
        currentMainCv.setStudent(dummyStudent);
        currentMainCv.setPriority(CvPriority.MAIN);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(targetCv));
        when(cvRepository.findByStudentAndPriority(dummyStudent, CvPriority.MAIN)).thenReturn(currentMainCv);

        studentService.setCVAsMain(dummyStudent.getId(), 10L);

        assert CvPriority.SECONDARY.equals(currentMainCv.getPriority());
        verify(cvRepository).save(currentMainCv);
    }

    @Test
    void shouldNotChangePriorityWhenCvIsAlreadyMain() throws UserNotFoundException, CvNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV currentMainCv = new CV();
        currentMainCv.setId(10L);
        currentMainCv.setStudent(dummyStudent);
        currentMainCv.setPriority(CvPriority.MAIN);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(currentMainCv));
        when(cvRepository.findByStudentAndPriority(dummyStudent, CvPriority.MAIN)).thenReturn(currentMainCv);

        studentService.setCVAsMain(dummyStudent.getId(), 10L);

        assert CvPriority.MAIN.equals(currentMainCv.getPriority());
        verify(cvRepository, times(1)).save(currentMainCv);
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingMainForNullStudent() {
        assertThrows(UserNotFoundException.class, () -> studentService.setCVAsMain(dummyStudent.getId(), 10L));
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingMainForDifferentStudent() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        Student otherStudent = new Student();
        otherStudent.setId(99L);

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(otherStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsMain(dummyStudent.getId(), 10L));
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingMainForNonExistentCv() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsMain(dummyStudent.getId(), 999L));
    }

    @Test
    void shouldNotifyEveryManagerWhenPendingCvBecomesPublic() throws Exception {
        // Arrange
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV(validPdfBytes, CvVisibility.VISIBLE, CVSharingScope.PRIVATE, CvPriority.MAIN, "cv.pdf", LocalDateTime.now());
        cv.setId(10L);
        cv.setStudent(dummyStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        Manager firstManager = new Manager();
        Manager secondManager = new Manager();

        when(managerRepository.findAll()).thenReturn(List.of(firstManager, secondManager));

        // Act
        studentService.setCvAsPublic(dummyStudent.getId(), 10L);

        // Assert
        verify(notificationRepository, times(2)).save(notificationArgumentCaptor.capture());

        List<Notification> notifications = notificationArgumentCaptor.getAllValues();

        assert (NotificationType.CV_SUBMITTED_FOR_REVIEW).equals(notifications.getFirst().getNotificationType());
        assert (Long.valueOf(10L)).equals(notifications.getFirst().getTargetId());
        assert (firstManager).equals(notifications.get(0).getUser());
        assert (secondManager).equals(notifications.get(1).getUser());
    }

    @Test
    void shouldNotNotifyManagersWhenReviewedCvBecomesPublic() throws Exception {
        // Arrange
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV(validPdfBytes, CvVisibility.VISIBLE, CVSharingScope.PRIVATE, CvPriority.MAIN, "cv.pdf", LocalDateTime.now());
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setStatus(CvStatus.APPROVED);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        // Act
        studentService.setCvAsPublic(dummyStudent.getId(), 10L);

        // Assert
        assert (CVSharingScope.PUBLIC).equals(cv.getSharingScope());

        verifyNoInteractions(managerRepository, notificationRepository);
    }

    @Test
    void createNewInternshipNotificationsForStudents_shouldNotifyOnlyEligibleStudents() {
        // Arrange
        Internship internship = mock(Internship.class);
        Employer employer = mock(Employer.class);
        Student eligibleStudent = mock(Student.class);
        Student ineligibleStudent = mock(Student.class);

        when(internship.getId()).thenReturn(42L);
        when(internship.getPostedBy()).thenReturn(employer);
        when(employer.getDiscipline()).thenReturn(Discipline.COMPUTER_SCIENCE);

        when(studentRepository.findByDiscipline(Discipline.COMPUTER_SCIENCE))
                .thenReturn(List.of(eligibleStudent, ineligibleStudent));

        CV approvedVisibleCv = mock(CV.class);
        when(approvedVisibleCv.getVisibility()).thenReturn(CvVisibility.VISIBLE);
        when(approvedVisibleCv.getStatus()).thenReturn(CvStatus.APPROVED);

        CV pendingCv = mock(CV.class);
        when(pendingCv.getVisibility()).thenReturn(CvVisibility.VISIBLE);
        when(pendingCv.getStatus()).thenReturn(CvStatus.PENDING);

        when(cvRepository.findByStudent(eligibleStudent)).thenReturn(List.of(approvedVisibleCv));
        when(cvRepository.findByStudent(ineligibleStudent)).thenReturn(List.of(pendingCv));

        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUser(
                NotificationType.NEW_INTERNSHIP_OFFER, 42L, eligibleStudent)).thenReturn(false);
        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUser(
                NotificationType.NEW_INTERNSHIP_OFFER, 42L, ineligibleStudent)).thenReturn(false);

        // Act
        studentService.createNewInternshipNotificationsForStudents(internship);

        // Assert
        verify(notificationRepository, times(1)).save(argThat(notification ->
                notification.getNotificationType() == NotificationType.NEW_INTERNSHIP_OFFER
                        && notification.getTargetType() == TargetType.INTERNSHIP_OFFER
                        && notification.getTargetId().equals(42L)
                        && notification.getUser() == eligibleStudent
        ));

        verify(notificationRepository, never()).save(argThat(notification ->
                notification.getUser() == ineligibleStudent
        ));
    }

    @Test
    void createNewInternshipNotificationsForStudents_shouldNotCreateDuplicateNotification() {
        // Arrange
        Internship internship = mock(Internship.class);
        Employer employer = mock(Employer.class);
        Student student = mock(Student.class);

        when(internship.getId()).thenReturn(42L);
        when(internship.getPostedBy()).thenReturn(employer);
        when(employer.getDiscipline()).thenReturn(Discipline.COMPUTER_SCIENCE);

        when(studentRepository.findByDiscipline(Discipline.COMPUTER_SCIENCE)).thenReturn(List.of(student));

        CV approvedVisibleCv = mock(CV.class);
        when(approvedVisibleCv.getVisibility()).thenReturn(CvVisibility.VISIBLE);
        when(approvedVisibleCv.getStatus()).thenReturn(CvStatus.APPROVED);
        when(cvRepository.findByStudent(student)).thenReturn(List.of(approvedVisibleCv));

        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUser(
                NotificationType.NEW_INTERNSHIP_OFFER, 42L, student)).thenReturn(true);

        // Act
        studentService.createNewInternshipNotificationsForStudents(internship);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void markInternshipsNotificationAsRead_shouldCallRepositoryBulkUpdateForStudent() throws UserNotFoundException {
        // Arrange
        String studentEmail = "student@example.com";

        // Act
        studentService.markInternshipsNotificationAsRead(studentEmail);

        // Assert
        verify(notificationRepository, times(1))
                .markAllAsReadByEmailAndNotificationType(studentEmail, NotificationType.NEW_INTERNSHIP_OFFER);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void createNewInternshipNotificationsForStudents_shouldCreateAndSaveNotification_whenStudentMatchesDisciplineHasApprovedCv() {
        // Arrange
        Discipline discipline = Discipline.COMPUTER_SCIENCE;

        Employer employer = mock(Employer.class);
        when(employer.getDiscipline()).thenReturn(discipline);

        Internship internship = mock(Internship.class);
        when(internship.getId()).thenReturn(100L);
        when(internship.getPostedBy()).thenReturn(employer);

        Student student = mock(Student.class);
        when(studentRepository.findByDiscipline(discipline)).thenReturn(List.of(student));

        CV approvedCv = mock(CV.class);
        when(approvedCv.getVisibility()).thenReturn(CvVisibility.VISIBLE);
        when(approvedCv.getStatus()).thenReturn(CvStatus.APPROVED);

        when(cvRepository.findByStudent(student)).thenReturn(List.of(approvedCv));
        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUser(
                NotificationType.NEW_INTERNSHIP_OFFER, 100L, student)).thenReturn(false);

        // Act
        studentService.createNewInternshipNotificationsForStudents(internship);

        // Assert
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void createNewInternshipNotificationsForStudents_shouldSkipCreation_whenNotificationAlreadyExists() {
        // Arrange
        Discipline discipline = Discipline.COMPUTER_SCIENCE;

        Employer employer = mock(Employer.class);
        when(employer.getDiscipline()).thenReturn(discipline);

        Internship internship = mock(Internship.class);
        when(internship.getId()).thenReturn(100L);
        when(internship.getPostedBy()).thenReturn(employer);

        Student student = mock(Student.class);
        when(studentRepository.findByDiscipline(discipline)).thenReturn(List.of(student));

        CV approvedCv = mock(CV.class);
        when(approvedCv.getVisibility()).thenReturn(CvVisibility.VISIBLE);
        when(approvedCv.getStatus()).thenReturn(CvStatus.APPROVED);

        when(cvRepository.findByStudent(student)).thenReturn(List.of(approvedCv));
        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUser(
                NotificationType.NEW_INTERNSHIP_OFFER, 100L, student)).thenReturn(true);

        // Act
        studentService.createNewInternshipNotificationsForStudents(internship);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void createNewInternshipNotificationsForStudents_shouldSkipCreation_whenStudentHasNoApprovedCv() {
        // Arrange
        Discipline discipline = Discipline.COMPUTER_SCIENCE;

        Employer employer = mock(Employer.class);
        when(employer.getDiscipline()).thenReturn(discipline);

        Internship internship = mock(Internship.class);
        when(internship.getId()).thenReturn(100L);
        when(internship.getPostedBy()).thenReturn(employer);

        Student student = mock(Student.class);
        when(studentRepository.findByDiscipline(discipline)).thenReturn(List.of(student));

        CV pendingCv = mock(CV.class);
        when(pendingCv.getVisibility()).thenReturn(CvVisibility.VISIBLE);
        when(pendingCv.getStatus()).thenReturn(CvStatus.PENDING);

        when(cvRepository.findByStudent(student)).thenReturn(List.of(pendingCv));
        when(notificationRepository.existsByNotificationTypeAndTargetIdAndUser(
                NotificationType.NEW_INTERNSHIP_OFFER, 100L, student)).thenReturn(false);

        // Act
        studentService.createNewInternshipNotificationsForStudents(internship);

        // Assert
        verify(notificationRepository, never()).save(any(Notification.class));
    }
}