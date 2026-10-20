package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyExistsException;
import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyReadException;
import com.lacouf.rsbjwt.exception.application.DeadlineAlreadyPassedException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.users.StudentService;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.apache.pdfbox.pdmodel.PDDocument;
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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.answer;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentServiceTest {

    @InjectMocks
    private StudentService studentService;

    @Mock
    private NotificationService notificationService;
    @Mock
    private UserAppService userAppService;

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private CVRepository cvRepository;
    @Mock
    private ManagerRepository managerRepository;
    @Mock
    private InternshipRepository internshipRepository;
    @Mock
    private InternshipApplicationRepository applicationRepository;

    @Captor
    private ArgumentCaptor<Student> studentArgumentCaptor;
    @Captor
    private ArgumentCaptor<CV> cvArgumentCaptor;
    @Captor
    private ArgumentCaptor<InternshipApplication> applicationArgumentCaptor;

    private static StudentSignUpDto studentSignUpDto;
    private Student dummyStudent;
    private static byte[] validPdfBytes;

    private static final String STUDENT_EMAIL = "test@claurendeau.qc.ca";

    private static Employer employer;
    private static Internship internship;

    private static final String EMPLOYER_EMAIL = "email@example.com";
    private static final LocalDate START_DATE = LocalDate.now().plusMonths(4);
    private static final LocalDate APPLICATION_DEADLINE = LocalDate.now().plusMonths(2);


    @BeforeAll
    static void createStudentSignUpDto() throws IOException {
        studentSignUpDto = new StudentSignUpDto("First Name", "Last Name", "1234567", "test@claurendeau.qc.ca", "Test123@", Discipline.COMPUTER_SCIENCE);

        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            doc.addPage(new PDPage());
            doc.save(baos);
            validPdfBytes = baos.toByteArray();
        }


        Credentials credentials = Credentials.builder()
                .email(EMPLOYER_EMAIL)
                .password("Test123@-encoded")
                .role(Role.EMPLOYER)
                .build();

        employer = new Employer("First Name", "Last Name", credentials, "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");
        employer.setId(1L);
    }

    @BeforeEach
    void setUp() {
        dummyStudent = new Student(
                "First Name", "Last Name", "1234567",
                Credentials.builder().email("test@claurendeau.qc.ca").role(Role.STUDENT).build(),
                Discipline.COMPUTER_SCIENCE
        );
        dummyStudent.setId(1L);
        internship = new Internship("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID, START_DATE, APPLICATION_DEADLINE, new BigDecimal("25.00"), false, employer);
        internship.setId(10L);
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
        // Arrange
        Credentials credentials = Credentials.builder().email(STUDENT_EMAIL).password("Test123@-encoded").role(Role.STUDENT).build();

        when(userAppService.createCredentials(STUDENT_EMAIL, "Test123@", Role.STUDENT)).thenReturn(credentials);

        when(studentRepository.save(any(Student.class)))
                .thenAnswer(answer((Student student) -> {
                    student.setId(1L);
                    return student;
                }));

        // Act
        studentService.save(studentSignUpDto);

        // Assert
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
        // Arrange
        when(studentRepository.findByStudentId(studentSignUpDto.studentId())).thenReturn(Optional.of(new Student()));

        // Act
        UserAlreadyExistsException exception = assertThrows(
                UserAlreadyExistsException.class,
                () -> studentService.save(studentSignUpDto)
        );

        // Assert
        assert "studentId".equals(exception.getField());
        assert "user already exists".equals(exception.getMessage());

        verify(studentRepository, never()).save(any(Student.class));
    }

    // ==========================================
    // CV Upload Tests
    // ==========================================

    @Test
    void shouldUploadCVForExistingStudent() throws Exception {
        // Arrange
        CvUploadDto upload = new CvUploadDto(validPdfBytes, "cv.pdf");

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));

        // Act
        studentService.uploadCV(upload, STUDENT_EMAIL);

        // Assert
        verify(cvRepository).save(cvArgumentCaptor.capture());

        assert dummyStudent.equals(cvArgumentCaptor.getValue().getStudent());
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenUploadingCVForUnknownEmail() {
        // Arrange
        CvUploadDto upload = new CvUploadDto(validPdfBytes, "cv.pdf");

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(UserNotFoundException.class, () -> studentService.uploadCV(upload, STUDENT_EMAIL));

        verifyNoInteractions(cvRepository);
    }

    @Test
    void shouldSaveCVSuccessfully() throws Exception {
        // Arrange
        CvUploadDto upload = new CvUploadDto(validPdfBytes, "cv.pdf");

        // Act
        studentService.saveCV(upload, dummyStudent);

        // Assert
        verify(cvRepository).save(cvArgumentCaptor.capture());
        CV savedCv = cvArgumentCaptor.getValue();

        assert "cv.pdf".equals(savedCv.getFileName());
        assert dummyStudent.equals(savedCv.getStudent());
        assert savedCv.getUploadDate() != null;
        assert calculateHash(validPdfBytes).equals(savedCv.getFileHash());
        assert CvVisibility.VISIBLE.equals(savedCv.getVisibility());
        assert ReviewStatus.PENDING.equals(savedCv.getStatus());
    }

    @Test
    void shouldNotifyEveryManagerWhenCVIsSubmitted() throws Exception {
        // Arrange
        CvUploadDto upload = new CvUploadDto(validPdfBytes, "cv.pdf");

        CV savedCv = new CV();
        savedCv.setId(10L);

        Manager firstManager = new Manager();
        Manager secondManager = new Manager();

        when(cvRepository.save(any(CV.class))).thenReturn(savedCv);
        when(managerRepository.findAll()).thenReturn(List.of(firstManager, secondManager));

        // Act
        studentService.saveCV(upload, dummyStudent);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.CV_SUBMITTED_FOR_REVIEW, 10L, firstManager);
        verify(notificationService).notifyIfAbsent(NotificationType.CV_SUBMITTED_FOR_REVIEW, 10L, secondManager);
    }

    @Test
    void shouldNotifyEmployerWhenStudentAppliesToInternship() throws Exception {
        // Arrange
        CV approvedCv = new CV();

        approvedCv.setId(5L);
        approvedCv.setStatus(ReviewStatus.APPROVED);
        approvedCv.setVisibility(CvVisibility.VISIBLE);
        approvedCv.setStudent(dummyStudent);

        internship.setStatus(ReviewStatus.APPROVED);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(approvedCv));
        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));
        when(applicationRepository.existsByStudentAndInternship(dummyStudent, internship)).thenReturn(false);
        when(applicationRepository.save(any(InternshipApplication.class))).thenAnswer(invocation -> {
            InternshipApplication application = invocation.getArgument(0);
            application.setId(20L);
            return application;
        });

        // Act
        studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.NEW_INTERNSHIP_APPLICATION, 20L, internship.getPostedBy());
    }

    @Test
    void shouldNotNotifyManagersWhenCVIsInvalid() {
        // Arrange
        CvUploadDto upload = new CvUploadDto("Hello World".getBytes(), "file.txt");

        // Act
        assertThrows(InvalidFileTypeException.class, () -> studentService.saveCV(upload, dummyStudent));

        // Assert
        verifyNoInteractions(cvRepository, managerRepository, notificationService);
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenContentIsNull() {
        // Arrange
        CvUploadDto upload = new CvUploadDto(null, "cv.pdf");

        // Act
        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );

        // Assert
        assert "File content cannot be null or empty.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenContentIsEmpty() {
        // Arrange
        CvUploadDto upload = new CvUploadDto(new byte[0], "cv.pdf");

        // Act
        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );

        // Assert
        assert "File content cannot be null or empty.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowInvalidFileSizeExceptionWhenFileExceedsMaxSize() {
        // Arrange
        CvUploadDto upload = new CvUploadDto(new byte[2 * 1024 * 1024 + 1], "large.pdf");

        // Act + Assert
        assertThrows(
                InvalidFileSizeException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );

        verifyNoInteractions(cvRepository);
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenMimeTypeIsNotPdf() {
        // Arrange
        CvUploadDto upload = new CvUploadDto("Hello World".getBytes(), "file.txt");

        // Act
        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );

        // Assert
        assert "Invalid file type. Only PDF files are allowed.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenPdfIsCorrupted() {
        // Arrange
        CvUploadDto upload = new CvUploadDto("%PDF-1.4 Fake PDF Content That Cannot Be Parsed".getBytes(), "corrupted.pdf");

        // Act + Assert
        assertThrows(
                CorruptedFileException.class,
                () -> studentService.saveCV(upload, dummyStudent)
        );

        verifyNoInteractions(cvRepository);
    }

    // ==========================================
    // CV Retrieval & Check Tests
    // ==========================================

    @Test
    void shouldReturnTrueWhenIsCVReadable() throws NoSuchAlgorithmException {
        // Arrange
        CV cv = new CV();
        cv.setContent(validPdfBytes);
        cv.setFileHash(calculateHash(validPdfBytes));

        // Act
        boolean readable = studentService.isCVReadable(cv);

        // Assert
        assert readable;
    }

    @Test
    void shouldReturnFalseWhenIsCVReadableHasMismatchedHash() throws NoSuchAlgorithmException {
        // Arrange
        CV cv = new CV();
        cv.setContent(validPdfBytes);
        cv.setFileHash("invalid_hash_string");

        // Act
        boolean readable = studentService.isCVReadable(cv);

        // Assert
        assert !readable;
    }

    @Test
    void shouldReturnFalseWhenIsCVReadableHasCorruptedContent() throws NoSuchAlgorithmException {
        // Arrange
        byte[] fakeBytes = "Corrupted Data".getBytes();
        CV cv = new CV();
        cv.setContent(fakeBytes);
        cv.setFileHash(calculateHash(fakeBytes));

        // Act
        boolean readable = studentService.isCVReadable(cv);

        // Assert
        assert !readable;
    }

    @Test
    void shouldReturnFalseWhenIsCVReadableIsNull() throws NoSuchAlgorithmException {
        // Act
        boolean readable = studentService.isCVReadable(null);

        // Assert
        assert !readable;
    }

    @Test
    void shouldReturnFalseWhenIsCVReadableHasEmptyContent() throws NoSuchAlgorithmException {
        // Arrange
        CV cv = new CV();
        cv.setContent(new byte[0]);

        // Act
        boolean readable = studentService.isCVReadable(cv);

        // Assert
        assert !readable;
    }

    @Test
    void shouldGetCVCountByStudent() throws UserNotFoundException {
        // Arrange
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.countByStudentAndVisibility(dummyStudent, CvVisibility.VISIBLE)).thenReturn(3L);

        // Act
        long count = studentService.getCVCount(STUDENT_EMAIL);

        // Assert
        assert count == 3L;
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenGettingCVCountForUnknownEmail() {
        // Arrange
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(UserNotFoundException.class, () -> studentService.getCVCount(STUDENT_EMAIL));
    }

    @Test
    void shouldGetCVsSuccessfully() throws Exception {
        // Arrange
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));

        CV visibleCv = new CV();
        visibleCv.setId(1L);
        visibleCv.setContent(validPdfBytes);
        visibleCv.setFileHash(calculateHash(validPdfBytes));
        visibleCv.setVisibility(CvVisibility.VISIBLE);

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(visibleCv));

        // Act
        List<StudentCvResponseDto> cvs = studentService.getCVs(STUDENT_EMAIL);

        // Assert
        assert cvs.size() == 1;
        assert Long.valueOf(1L).equals(cvs.getFirst().id());
        assert Long.valueOf(validPdfBytes.length).equals(cvs.getFirst().sizeBytes());
    }

    @Test
    void shouldSkipHiddenCVsWhenGettingCVs() throws Exception {
        // Arrange
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));

        CV hiddenCv = new CV();
        hiddenCv.setId(1L);
        hiddenCv.setContent(validPdfBytes);
        hiddenCv.setFileHash(calculateHash(validPdfBytes));
        hiddenCv.setVisibility(CvVisibility.HIDDEN);

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(hiddenCv));

        // Act
        List<StudentCvResponseDto> cvs = studentService.getCVs(STUDENT_EMAIL);

        // Assert
        assert cvs.isEmpty();
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenGettingCVsWithCorruptedFile() {
        // Arrange
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));

        CV corruptedCv = new CV();
        corruptedCv.setId(2L);
        corruptedCv.setContent("Corrupted".getBytes());
        corruptedCv.setFileHash("badhash");

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(corruptedCv));

        // Act + Assert
        assertThrows(CorruptedFileException.class, () -> studentService.getCVs(STUDENT_EMAIL));
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenGettingCVsForUnknownEmail() {
        // Arrange
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(UserNotFoundException.class, () -> studentService.getCVs(STUDENT_EMAIL));
    }

    @Test
    void shouldGetMaxCVSize() {
        // Act + Assert
        assert Integer.valueOf(2 * 1024 * 1024).equals(studentService.getMaxCVSize());
    }

    @Test
    void shouldGetCVFileWhenStudentOwnsIt() throws Exception {
        // Arrange
        CV cv = new CV();
        cv.setId(10L);
        cv.setFileName("cv.pdf");
        cv.setContent(validPdfBytes);
        cv.setFileHash(calculateHash(validPdfBytes));

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        // Act
        CvFileResponseDto result = studentService.getCV(STUDENT_EMAIL, 10L);

        // Assert
        assert Long.valueOf(10L).equals(result.id());
        assert ("cv.pdf").equals(result.fileName());
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenGettingCVNotOwnedByStudent() {
        // Arrange
        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(CvNotFoundException.class, () -> studentService.getCV(STUDENT_EMAIL, 10L));
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenGettingCorruptedCV() {
        // Arrange
        CV cv = new CV();
        cv.setId(10L);
        cv.setContent("Corrupted".getBytes());
        cv.setFileHash("badhash");

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        // Act + Assert
        assertThrows(CorruptedFileException.class, () -> studentService.getCV(STUDENT_EMAIL, 10L));
    }

    @Test
    void shouldGetCVStatusWhenStudentOwnsIt() throws CvNotFoundException {
        // Arrange
        CV cv = new CV();
        cv.setId(10L);
        cv.setStatus(ReviewStatus.APPROVED);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        // Act + Assert
        assert ("APPROVED").equals(studentService.getCVStatus(STUDENT_EMAIL, 10L));
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenGettingStatusOfCVNotOwnedByStudent() {
        // Arrange
        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(CvNotFoundException.class, () -> studentService.getCVStatus(STUDENT_EMAIL, 10L));
    }

    // ==========================================
    // Visibility Tests
    // ==========================================

    @Test
    void shouldSetCvAsInvisible() throws CvNotFoundException {
        // Arrange
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setVisibility(CvVisibility.VISIBLE);

        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.of(cv));

        // Act
        studentService.setCvAsInvisible(STUDENT_EMAIL, 10L);

        // Assert
        assert CvVisibility.HIDDEN.equals(cv.getVisibility());
        verify(cvRepository).save(cv);
        verify(notificationService).closeNotificationsOfTarget(TargetType.CV, 10L);
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingInvisibleForCvNotOwnedByStudent() {
        // Arrange
        when(cvRepository.findByIdAndStudent_Credentials_Email(10L, STUDENT_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(CvNotFoundException.class, () -> studentService.setCvAsInvisible(STUDENT_EMAIL, 10L));

        verify(cvRepository, never()).save(any(CV.class));
        verifyNoInteractions(notificationService);
    }

    // ==========================================
    // Student Internship Test
    // ==========================================

    @Test
    void shouldGetAInternshipsSuccessfully() throws UserNotFoundException {
        //Assert
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(internshipRepository.findByPostedBy_DisciplineAndDeletedIsFalse(dummyStudent.getDiscipline())).thenReturn(List.of(internship));
        internship.setStatus(ReviewStatus.APPROVED);
        //Act + Assert
        assert !studentService.getInternships(dummyStudent.getEmail()).isEmpty();
    }

    @Test
    void shouldNotGetAInternshipsWhenStatusIsNotApproved() throws UserNotFoundException {
        //Assert
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(internshipRepository.findByPostedBy_DisciplineAndDeletedIsFalse(dummyStudent.getDiscipline())).thenReturn(List.of(internship));
        //Act + Assert
        assert studentService.getInternships(dummyStudent.getEmail()).isEmpty();
    }

    @Test
    void shouldNotGetAInternshipsWhenAfterDeadline() throws UserNotFoundException {
        //Assert
        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(internshipRepository.findByPostedBy_DisciplineAndDeletedIsFalse(dummyStudent.getDiscipline())).thenReturn(List.of(internship));
        internship.setApplicationDeadline(LocalDate.now().minusDays(1L));
        //Act + Assert
        assert studentService.getInternships(dummyStudent.getEmail()).isEmpty();
    }


    @Test
    void shouldApplyToInternshipSuccessfully() throws Exception {
        // Arrange
        CV approvedCv = new CV();
        approvedCv.setId(5L);
        approvedCv.setStatus(ReviewStatus.APPROVED);
        approvedCv.setVisibility(CvVisibility.VISIBLE);
        approvedCv.setStudent(dummyStudent);

        internship.setStatus(ReviewStatus.APPROVED);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(approvedCv));
        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));
        when(applicationRepository.existsByStudentAndInternship(dummyStudent, internship)).thenReturn(false);
        when(applicationRepository.save(any(InternshipApplication.class))).thenAnswer(invocation -> {
            InternshipApplication application = invocation.getArgument(0);
            application.setId(20L);
            return application;
        });

        // Act
        studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L);

        // Assert
        verify(applicationRepository).save(applicationArgumentCaptor.capture());
        InternshipApplication savedApplication = applicationArgumentCaptor.getValue();

        assert savedApplication.getStudent().equals(dummyStudent);
        assert savedApplication.getCv().equals(approvedCv);
        assert savedApplication.getInternship().equals(internship);
    }

    @Test
    void shouldThrowExceptionWhenApplyingWithUnapprovedCv() {
        // Arrange
        CV pendingCv = new CV();
        pendingCv.setId(5L);
        pendingCv.setStatus(ReviewStatus.PENDING);
        pendingCv.setVisibility(CvVisibility.VISIBLE);
        pendingCv.setStudent(dummyStudent);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(pendingCv));
        // The CV is validated before the internship, so the internship is never loaded.

        // Act & Assert
        CVNotApprovedException exception = assertThrows(
                CVNotApprovedException.class,
                () -> studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L)
        );

        assert "CV is not approved for application".equals(exception.getMessage());
        verifyNoInteractions(applicationRepository, internshipRepository);
    }

    @Test
    void shouldThrowExceptionWhenStudentAlreadyAppliedToInternship() {
        // Arrange
        CV approvedCv = new CV();
        approvedCv.setId(5L);
        approvedCv.setStatus(ReviewStatus.APPROVED);
        approvedCv.setVisibility(CvVisibility.VISIBLE);
        approvedCv.setStudent(dummyStudent);

        internship.setStatus(ReviewStatus.APPROVED);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(approvedCv));
        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));
        when(applicationRepository.existsByStudentAndInternship(dummyStudent, internship)).thenReturn(true);

        // Act & Assert
        ApplicationAlreadyExistsException exception = assertThrows(
                ApplicationAlreadyExistsException.class,
                () -> studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L)
        );

        assert "Student has already applied to this internship".equals(exception.getMessage());
        verify(applicationRepository, never()).save(any(InternshipApplication.class));
    }

    @Test
    void shouldThrowExceptionWhenApplicationDeadlineHasPassed() {
        // Arrange
        CV approvedCv = new CV();
        approvedCv.setId(5L);
        approvedCv.setStatus(ReviewStatus.APPROVED);
        approvedCv.setVisibility(CvVisibility.VISIBLE);
        approvedCv.setStudent(dummyStudent);

        internship.setStatus(ReviewStatus.APPROVED);
        internship.setApplicationDeadline(LocalDate.now().minusDays(1)); // Deadline in the past

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(approvedCv));
        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));

        // Act & Assert
        assertThrows(
                DeadlineAlreadyPassedException.class,
                () -> studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L)
        );

        verify(applicationRepository, never()).save(any(InternshipApplication.class));
    }

    @Test
    void shouldUpdateInternshipApplicationSuccessfully() throws Exception {
        // Arrange
        internship.setStatus(ReviewStatus.APPROVED);
        long applicationId = 1L;
        long newCvId = 2L;

        CV oldCv = new CV();
        oldCv.setStatus(ReviewStatus.APPROVED);

        CV newCv = new CV();
        newCv.setId(newCvId);
        newCv.setStatus(ReviewStatus.APPROVED);
        newCv.setVisibility(CvVisibility.VISIBLE);

        InternshipApplication application = new InternshipApplication(internship, oldCv, dummyStudent);
        application.setInternshipApplicationStatus(InternshipApplicationStatus.UNREAD);

        when(applicationRepository.findByIdAndStudent_Credentials_Email(applicationId, STUDENT_EMAIL))
                .thenReturn(Optional.of(application));
        when(cvRepository.findByIdAndStudent_Credentials_Email(newCvId, STUDENT_EMAIL))
                .thenReturn(Optional.of(newCv));

        // Act
        studentService.updateInternshipApplication(STUDENT_EMAIL, applicationId, newCvId);

        // Assert
        assert application.getCv().equals(newCv);
    }

    @Test
    void shouldThrowExceptionWhenUpdatingWithUnapprovedCv() {
        // Arrange
        internship.setStatus(ReviewStatus.APPROVED);
        long applicationId = 1L;
        long newCvId = 2L;

        CV oldCv = new CV();

        CV newCv = new CV();
        newCv.setId(newCvId);
        newCv.setStatus(ReviewStatus.PENDING); // Not approved
        newCv.setVisibility(CvVisibility.VISIBLE);

        InternshipApplication application = new InternshipApplication(internship, oldCv, dummyStudent);
        application.setInternshipApplicationStatus(InternshipApplicationStatus.UNREAD);

        when(applicationRepository.findByIdAndStudent_Credentials_Email(applicationId, STUDENT_EMAIL))
                .thenReturn(Optional.of(application));
        when(cvRepository.findByIdAndStudent_Credentials_Email(newCvId, STUDENT_EMAIL))
                .thenReturn(Optional.of(newCv));

        // Act & Assert
        assertThrows(CVNotApprovedException.class, () ->
                studentService.updateInternshipApplication(STUDENT_EMAIL, applicationId, newCvId)
        );

        assert application.getCv().equals(oldCv); // unchanged
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void shouldThrowExceptionWhenUpdatingAlreadyReadApplication() {
        // Arrange
        internship.setStatus(ReviewStatus.APPROVED);
        long applicationId = 1L;
        long newCvId = 2L;

        InternshipApplication application = new InternshipApplication(internship, new CV(), dummyStudent);
        application.setInternshipApplicationStatus(InternshipApplicationStatus.READ); // Already read by employer

        when(applicationRepository.findByIdAndStudent_Credentials_Email(applicationId, STUDENT_EMAIL))
                .thenReturn(Optional.of(application));

        // Act & Assert
        assertThrows(ApplicationAlreadyReadException.class, () ->
                studentService.updateInternshipApplication(STUDENT_EMAIL, applicationId, newCvId)
        );

        verifyNoInteractions(cvRepository);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void shouldThrowExceptionWhenApplicationNotFound() {
        // Arrange
        long applicationId = 99L;
        long newCvId = 2L;

        when(applicationRepository.findByIdAndStudent_Credentials_Email(applicationId, STUDENT_EMAIL))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(InternshipApplicationNotFoundException.class, () ->
                studentService.updateInternshipApplication(STUDENT_EMAIL, applicationId, newCvId)
        );

        verifyNoInteractions(cvRepository);
    }

    // ---------- Helper ----------

    private CV approvedVisibleCv(long id) {
        CV cv = new CV();
        cv.setId(id);
        cv.setStatus(ReviewStatus.APPROVED);
        cv.setVisibility(CvVisibility.VISIBLE);
        cv.setStudent(dummyStudent);
        return cv;
    }

    // ---------- Apply: CV visibility ----------

    @Test
    void shouldThrowExceptionWhenApplyingWithHiddenCv() {
        // Arrange
        CV hiddenCv = approvedVisibleCv(5L);
        hiddenCv.setVisibility(CvVisibility.HIDDEN);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(hiddenCv));

        // Act & Assert
        CVNotVisibleException exception = assertThrows(
                CVNotVisibleException.class,
                () -> studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L)
        );

        assert "CV is not visible for application".equals(exception.getMessage());
        verifyNoInteractions(applicationRepository, internshipRepository);
    }

    // ---------- Apply: internship validation ----------

    @Test
    void shouldThrowInternshipNotFoundWhenApplyingToDeletedInternship() {
        // Arrange
        internship.setStatus(ReviewStatus.APPROVED);
        internship.markAsDeleted();

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(approvedVisibleCv(5L)));
        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));

        // Act & Assert
        assertThrows(InternshipNotFoundException.class,
                () -> studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L));

        verifyNoInteractions(applicationRepository);
    }

    @Test
    void shouldThrowInternshipNotFoundWhenApplyingToUnapprovedInternship() {
        // Arrange
        internship.setStatus(ReviewStatus.PENDING);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(approvedVisibleCv(5L)));
        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));

        // Act & Assert
        assertThrows(InternshipNotFoundException.class,
                () -> studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L));

        verifyNoInteractions(applicationRepository);
    }

    @Test
    void shouldThrowInternshipNotFoundWhenApplyingToInternshipOfAnotherDiscipline() {
        Student otherStudent = new Student(
                "Other", "Student", "7654321",
                Credentials.builder().email(STUDENT_EMAIL).role(Role.STUDENT).build(),
                Discipline.CIVIL_ENGINEERING
        );
        otherStudent.setId(2L);

        internship.setStatus(ReviewStatus.APPROVED);

        when(studentRepository.findByCredentialsEmail(STUDENT_EMAIL)).thenReturn(Optional.of(otherStudent));
        when(cvRepository.findByIdAndStudent_Credentials_Email(5L, STUDENT_EMAIL)).thenReturn(Optional.of(approvedVisibleCv(5L)));
        when(internshipRepository.findById(10L)).thenReturn(Optional.of(internship));

        // Act & Assert
        assertThrows(InternshipNotFoundException.class,
                () -> studentService.applyToInternship(STUDENT_EMAIL, 5L, 10L));

        verifyNoInteractions(applicationRepository);
    }


    @Test
    void shouldThrowExceptionWhenUpdatingWithHiddenCv() {
        // Arrange
        internship.setStatus(ReviewStatus.APPROVED);
        long applicationId = 1L;
        long newCvId = 2L;

        CV oldCv = new CV();
        CV hiddenCv = approvedVisibleCv(newCvId);
        hiddenCv.setVisibility(CvVisibility.HIDDEN);

        InternshipApplication application = new InternshipApplication(internship, oldCv, dummyStudent);
        application.setInternshipApplicationStatus(InternshipApplicationStatus.UNREAD);

        when(applicationRepository.findByIdAndStudent_Credentials_Email(applicationId, STUDENT_EMAIL))
                .thenReturn(Optional.of(application));
        when(cvRepository.findByIdAndStudent_Credentials_Email(newCvId, STUDENT_EMAIL))
                .thenReturn(Optional.of(hiddenCv));

        // Act & Assert
        CVNotVisibleException exception = assertThrows(
                CVNotVisibleException.class,
                () -> studentService.updateInternshipApplication(STUDENT_EMAIL, applicationId, newCvId)
        );

        assert "CV is not visible for application".equals(exception.getMessage());
        assert application.getCv().equals(oldCv);
        verify(applicationRepository, never()).save(any());
    }


    @Test
    void shouldThrowExceptionWhenUpdatingAfterDeadlineHasPassed() {
        // Arrange
        internship.setStatus(ReviewStatus.APPROVED);
        long applicationId = 1L;
        long newCvId = 2L;

        internship.setApplicationDeadline(LocalDate.now().minusDays(1));

        InternshipApplication application = new InternshipApplication(internship, new CV(), dummyStudent);
        application.setInternshipApplicationStatus(InternshipApplicationStatus.UNREAD);

        when(applicationRepository.findByIdAndStudent_Credentials_Email(applicationId, STUDENT_EMAIL))
                .thenReturn(Optional.of(application));

        // Act & Assert
        assertThrows(
                DeadlineAlreadyPassedException.class,
                () -> studentService.updateInternshipApplication(STUDENT_EMAIL, applicationId, newCvId)
        );

        verifyNoInteractions(cvRepository);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void shouldThrowApplicationNotFoundWhenApplicationBelongsToAnotherStudent() {
        // Arrange
        String intruderEmail = "intruder@claurendeau.qc.ca";

        when(applicationRepository.findByIdAndStudent_Credentials_Email(1L, intruderEmail))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(InternshipApplicationNotFoundException.class,
                () -> studentService.updateInternshipApplication(intruderEmail, 1L, 2L));

        verify(applicationRepository, never()).save(any());
        verifyNoInteractions(cvRepository);
    }
}