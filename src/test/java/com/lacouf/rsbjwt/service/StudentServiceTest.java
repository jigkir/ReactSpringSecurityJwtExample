package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.repository.cv.CVRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.users.StudentService;
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
    private NotificationService notificationService;

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private UserAppRepository userAppRepository;
    @Mock
    private CVRepository cvRepository;
    @Mock
    private ManagerRepository managerRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Student> studentArgumentCaptor;
    @Captor
    private ArgumentCaptor<CV> cvArgumentCaptor;

    private static StudentSignUpDto studentSignUpDto;
    private Student dummyStudent;
    private static byte[] validPdfBytes;

    private static final String STUDENT_EMAIL = "test@claurendeau.qc.ca";

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
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.countByStudentAndVisibility(dummyStudent, CvVisibility.VISIBLE)).thenReturn(3L);

        long count = studentService.getCVCount(STUDENT_EMAIL);

        assert count == 3L;
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenGettingCVCountForUnknownEmail() {
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> studentService.getCVCount(STUDENT_EMAIL));
    }

    @Test
    void shouldGetCVsSuccessfully() throws Exception {
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));

        CV visibleCv = new CV();
        visibleCv.setId(1L);
        visibleCv.setContent(validPdfBytes);
        visibleCv.setFileHash(calculateHash(validPdfBytes));
        visibleCv.setVisibility(CvVisibility.VISIBLE);

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(visibleCv));

        List<StudentCvResponseDto> cvs = studentService.getCVs(STUDENT_EMAIL);

        assert cvs.size() == 1;
        assert Long.valueOf(1L).equals(cvs.get(0).id());
    }

    @Test
    void shouldSkipHiddenCVsWhenGettingCVs() throws Exception {
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));

        CV hiddenCv = new CV();
        hiddenCv.setId(1L);
        hiddenCv.setContent(validPdfBytes);
        hiddenCv.setFileHash(calculateHash(validPdfBytes));
        hiddenCv.setVisibility(CvVisibility.HIDDEN);

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(hiddenCv));

        List<StudentCvResponseDto> cvs = studentService.getCVs(STUDENT_EMAIL);

        assert cvs.isEmpty();
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenGettingCVsWithCorruptedFile() {
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));

        CV corruptedCv = new CV();
        corruptedCv.setId(2L);
        corruptedCv.setContent("Corrupted".getBytes());
        corruptedCv.setFileHash("badhash");

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(corruptedCv));

        assertThrows(CorruptedFileException.class, () -> studentService.getCVs(STUDENT_EMAIL));
    }

    @Test
    void shouldGetMaxCVSize() {
        assert Integer.valueOf(2 * 1024 * 1024).equals(studentService.getMaxCVSize());
    }

    @Test
    void shouldGetCVFileWhenStudentOwnsIt() throws Exception {
        CV cv = new CV();
        cv.setId(10L);
        cv.setFileName("cv.pdf");
        cv.setContent(validPdfBytes);
        cv.setFileHash(calculateHash(validPdfBytes));

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        CvFileResponseDto result = studentService.getCV(STUDENT_EMAIL, 10L);

        assert Long.valueOf(10L).equals(result.id());
        assert ("cv.pdf").equals(result.fileName());
    }

    @Test
    void shouldGetCVStatusWhenStudentOwnsIt() throws CvNotFoundException {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStatus(CvStatus.APPROVED);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        assert ("APPROVED").equals(studentService.getCVStatus(STUDENT_EMAIL, 10L));
    }

// ==========================================
// Visibility & Sharing Scope Tests
// ==========================================

    @Test
    void shouldSetCvAsInvisible() throws CvNotFoundException {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setVisibility(CvVisibility.VISIBLE);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        studentService.setCvAsInvisible(STUDENT_EMAIL, 10L);

        assert CvVisibility.HIDDEN.equals(cv.getVisibility());
        verify(cvRepository).save(cv);
        verify(notificationService).closeNotificationsOfTarget(TargetType.CV, 10L);
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingInvisibleForCvNotOwnedByStudent() {
        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.empty());

        assertThrows(CvNotFoundException.class, () -> studentService.setCvAsInvisible(STUDENT_EMAIL, 10L));

        verify(cvRepository, never()).save(any(CV.class));
    }

    @Test
    void shouldSetCvAsPublic() throws CVAlreadyPublicException, CvNotFoundException {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PRIVATE);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        studentService.setCvAsPublic(STUDENT_EMAIL, 10L);

        assert CVSharingScope.PUBLIC.equals(cv.getSharingScope());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCVAlreadyPublicExceptionWhenCvIsAlreadyPublic() {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PUBLIC);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        assertThrows(CVAlreadyPublicException.class, () -> studentService.setCvAsPublic(STUDENT_EMAIL, 10L));
    }

    @Test
    void shouldSetCvAsPrivate() throws CVAlreadyPrivateException, CvNotFoundException {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PUBLIC);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        studentService.setCvAsPrivate(STUDENT_EMAIL, 10L);

        assert CVSharingScope.PRIVATE.equals(cv.getSharingScope());
        verify(cvRepository).save(cv);
        verify(notificationService).closeNotificationsOfTarget(TargetType.CV, 10L);
    }

    @Test
    void shouldThrowCVAlreadyPrivateExceptionWhenCvIsAlreadyPrivate() {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PRIVATE);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        assertThrows(CVAlreadyPrivateException.class, () -> studentService.setCvAsPrivate(STUDENT_EMAIL, 10L));
    }

    @Test
    void shouldSetCVAsSecondary() throws CvNotFoundException {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setPriority(CvPriority.MAIN);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        studentService.setCVAsSecondary(STUDENT_EMAIL, 10L);

        assert CvPriority.SECONDARY.equals(cv.getPriority());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingSecondaryForCvNotOwnedByStudent() {
        when(cvRepository.findByIdAndStudent_Credentials_Email(999L, STUDENT_EMAIL)).thenReturn(Optional.empty());

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsSecondary(STUDENT_EMAIL, 999L));
    }

    @Test
    void shouldSetCVAsMainWhenNoExistingMainCv() throws CvNotFoundException {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setPriority(CvPriority.SECONDARY);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));
        when(cvRepository.findByStudentAndPriority(dummyStudent, CvPriority.MAIN)).thenReturn(null);

        studentService.setCVAsMain(STUDENT_EMAIL, 10L);

        assert CvPriority.MAIN.equals(cv.getPriority());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldDemoteExistingMainCvAndPromoteNewCvToMain() throws CvNotFoundException {
        CV targetCv = new CV();
        targetCv.setId(10L);
        targetCv.setStudent(dummyStudent);
        targetCv.setPriority(CvPriority.SECONDARY);

        CV currentMainCv = new CV();
        currentMainCv.setId(5L);
        currentMainCv.setStudent(dummyStudent);
        currentMainCv.setPriority(CvPriority.MAIN);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(targetCv));
        when(cvRepository.findByStudentAndPriority(dummyStudent, CvPriority.MAIN)).thenReturn(currentMainCv);

        studentService.setCVAsMain(STUDENT_EMAIL, 10L);

        assert CvPriority.SECONDARY.equals(currentMainCv.getPriority());
        assert CvPriority.MAIN.equals(targetCv.getPriority());
        verify(cvRepository).save(currentMainCv);
        verify(cvRepository).save(targetCv);
    }

    @Test
    void shouldNotChangePriorityWhenCvIsAlreadyMain() throws CvNotFoundException {
        CV currentMainCv = new CV();
        currentMainCv.setId(10L);
        currentMainCv.setStudent(dummyStudent);
        currentMainCv.setPriority(CvPriority.MAIN);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(currentMainCv));
        when(cvRepository.findByStudentAndPriority(dummyStudent, CvPriority.MAIN)).thenReturn(currentMainCv);

        studentService.setCVAsMain(STUDENT_EMAIL, 10L);

        assert CvPriority.MAIN.equals(currentMainCv.getPriority());
        verify(cvRepository, times(1)).save(currentMainCv);
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingMainForCvNotOwnedByStudent() {
        when(cvRepository.findByIdAndStudent_Credentials_Email(999L, STUDENT_EMAIL)).thenReturn(Optional.empty());

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsMain(STUDENT_EMAIL, 999L));
    }

    @Test
    void shouldNotifyEveryManagerWhenPendingCvBecomesPublic() throws Exception {
        // Arrange
        CV cv = new CV(validPdfBytes, CvVisibility.VISIBLE, CVSharingScope.PRIVATE, CvPriority.MAIN, "cv.pdf", LocalDateTime.now());
        cv.setId(10L);
        cv.setStudent(dummyStudent);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        Manager firstManager = new Manager();
        Manager secondManager = new Manager();

        when(managerRepository.findAll()).thenReturn(List.of(firstManager, secondManager));

        // Act
        studentService.setCvAsPublic(STUDENT_EMAIL, 10L);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.CV_SUBMITTED_FOR_REVIEW, 10L, firstManager);
        verify(notificationService).notifyIfAbsent(NotificationType.CV_SUBMITTED_FOR_REVIEW, 10L, secondManager);
    }

    @Test
    void shouldNotNotifyManagersWhenReviewedCvBecomesPublic() throws Exception {
        // Arrange
        CV cv = new CV(validPdfBytes, CvVisibility.VISIBLE, CVSharingScope.PRIVATE, CvPriority.MAIN, "cv.pdf", LocalDateTime.now());
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setStatus(CvStatus.APPROVED);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        // Act
        studentService.setCvAsPublic(STUDENT_EMAIL, 10L);

        // Assert
        assert (CVSharingScope.PUBLIC).equals(cv.getSharingScope());

        verifyNoInteractions(managerRepository, notificationService);
    }

    @Test
    void shouldNotifyManagersAgainWhenCvBecomesPublicAfterBeingPrivate() throws Exception {
        // Arrange
        CV cv = new CV(validPdfBytes, CvVisibility.VISIBLE, CVSharingScope.PRIVATE, CvPriority.MAIN, "cv.pdf", LocalDateTime.now());
        cv.setId(10L);
        cv.setStudent(dummyStudent);

        Manager manager = new Manager();

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));
        when(managerRepository.findAll()).thenReturn(List.of(manager));

        studentService.setCvAsPublic(STUDENT_EMAIL, 10L);
        studentService.setCvAsPrivate(STUDENT_EMAIL, 10L);
        studentService.setCvAsPublic(STUDENT_EMAIL, 10L);

        // Assert
        verify(notificationService).closeNotificationsOfTarget(TargetType.CV, 10L);
        verify(notificationService, times(2)).notifyIfAbsent(NotificationType.CV_SUBMITTED_FOR_REVIEW, 10L, manager);
    }
}