package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.CVRepository;
import com.lacouf.rsbjwt.repository.StudentRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.*;
import com.lacouf.rsbjwt.service.dto.CVDto;
import com.lacouf.rsbjwt.service.dto.StudentSignUpDto;
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
    private PasswordEncoder passwordEncoder;

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
        // Arrange
        when(passwordEncoder.encode("Test123@")).thenReturn("Test123@-encoded");

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

    @Test
    void shouldThrowUserAlreadyExistsExceptionWhenEmailAlreadyUsed() {
        // Arrange
        when(userAppRepository.findByCredentialsEmail(studentSignUpDto.email())).thenReturn(Optional.of(new Student()));

        // Act
        UserAlreadyExistsException exception = assertThrows(
                UserAlreadyExistsException.class,
                () -> studentService.save(studentSignUpDto)
        );

        // Assert
        assert "email".equals(exception.getField());
        assert "user already exists".equals(exception.getMessage());

        verify(studentRepository, never()).save(any(Student.class));
    }

    // ==========================================
    // CV Tests
    // ==========================================

    @Test
    void shouldSaveCVSuccessfully() throws Exception {
        CVDto cvDto = new CVDto(validPdfBytes, null, CVSharingScope.PRIVATE, "cv.pdf", validPdfBytes.length, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE);

        studentService.saveCV(cvDto, dummyStudent);

        verify(cvRepository).save(cvArgumentCaptor.capture());
        CV savedCv = cvArgumentCaptor.getValue();

        assert "cv.pdf".equals(savedCv.getFileName());
        assert dummyStudent.equals(savedCv.getStudent());
        assert savedCv.getUploadDate() != null;
        assert calculateHash(validPdfBytes).equals(savedCv.getFileHash());
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenContentIsNull() {
        CVDto cvDto = new CVDto(null, null, CVSharingScope.PRIVATE, "cv.pdf", 0, LocalDateTime.now(),CvPriority.SECONDARY, CvVisibility.VISIBLE);

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
        );

        assert "File content cannot be null or empty.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenContentIsEmpty() {
        CVDto cvDto = new CVDto(new byte[0], null, CVSharingScope.PRIVATE, "cv.pdf", 0, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE);

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
        );

        assert "File content cannot be null or empty.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowInvalidFileSizeExceptionWhenFileExceedsMaxSize() {
        byte[] oversizedContent = new byte[2 * 1024 * 1024 + 1];
        CVDto cvDto = new CVDto(oversizedContent, null, CVSharingScope.PRIVATE, "large.pdf", oversizedContent.length, LocalDateTime.now(),CvPriority.SECONDARY, CvVisibility.VISIBLE);

        assertThrows(
                InvalidFileSizeException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
        );
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenMimeTypeIsNotPdf() {
        byte[] textFileBytes = "Hello World".getBytes();
        CVDto cvDto = new CVDto(textFileBytes, null, CVSharingScope.PRIVATE, "file.txt", textFileBytes.length, LocalDateTime.now(),CvPriority.SECONDARY, CvVisibility.VISIBLE);

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
        );

        assert "Invalid file type. Only PDF files are allowed.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenPdfIsCorrupted() {
        byte[] corruptedPdfBytes = "%PDF-1.4 Fake PDF Content That Cannot Be Parsed".getBytes();
        CVDto cvDto = new CVDto(corruptedPdfBytes, null, CVSharingScope.PRIVATE, "corrupted.pdf", corruptedPdfBytes.length, LocalDateTime.now(),CvPriority.SECONDARY, CvVisibility.VISIBLE);

        assertThrows(
                CorruptedFileException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
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
    void shouldGetCVCountByStudent() {
        when(cvRepository.countByStudent(dummyStudent)).thenReturn(3L);

        long count = studentService.getCVCountByStudent(dummyStudent);

        assert count == 3L;
    }

    @Test
    void shouldReturnZeroCVCountWhenStudentIsNull() {
        long count = studentService.getCVCountByStudent(null);

        assert count == 0L;
    }

    @Test
    void shouldGetCVsSuccessfully() throws Exception {
        CV visibleCv = new CV();
        visibleCv.setId(1L);
        visibleCv.setContent(validPdfBytes);
        visibleCv.setFileHash(calculateHash(validPdfBytes));
        visibleCv.setVisibility(CvVisibility.VISIBLE);

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(visibleCv));

        List<CVDto> cvs = studentService.getCVs(dummyStudent);

        assert cvs.size() == 1;
        assert Long.valueOf(1L).equals(cvs.get(0).id());
    }

    @Test
    void shouldSkipHiddenCVsWhenGettingCVs() throws Exception {
        CV hiddenCv = new CV();
        hiddenCv.setId(1L);
        hiddenCv.setContent(validPdfBytes);
        hiddenCv.setFileHash(calculateHash(validPdfBytes));
        hiddenCv.setVisibility(CvVisibility.HIDDEN);

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(hiddenCv));

        List<CVDto> cvs = studentService.getCVs(dummyStudent);

        assert cvs.isEmpty();
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenGettingCVsForNullStudent() {
        assertThrows(UserNotFoundException.class, () -> studentService.getCVs(null));
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenGettingCVsWithCorruptedFile() throws Exception {
        CV corruptedCv = new CV();
        corruptedCv.setId(2L);
        corruptedCv.setContent("Corrupted".getBytes());
        corruptedCv.setFileHash("badhash");

        when(cvRepository.findByStudent(dummyStudent)).thenReturn(List.of(corruptedCv));

        assertThrows(CorruptedFileException.class, () -> studentService.getCVs(dummyStudent));
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
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setVisibility(CvVisibility.VISIBLE);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        studentService.setCvAsInvisible(dummyStudent, 10L);

        assert CvVisibility.HIDDEN.equals(cv.getVisibility());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingInvisibleForNullStudent() {
        assertThrows(UserNotFoundException.class, () -> studentService.setCvAsInvisible(null, 10L));
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingInvisibleForDifferentStudent() {
        Student existingStudent = new Student();
        existingStudent.setStudentId("9999999");

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(existingStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(UserNotFoundException.class, () -> studentService.setCvAsInvisible(dummyStudent, 10L));
    }

    @Test
    void shouldSetCvAsPublic() throws UserNotFoundException, CVAlreadyPublicException, CvNotFoundException {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PRIVATE);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        studentService.setCvAsPublic(dummyStudent, 10L);

        assert CVSharingScope.PUBLIC.equals(cv.getSharingScope());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCVAlreadyPublicExceptionWhenCvIsAlreadyPublic() {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PUBLIC);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(CVAlreadyPublicException.class, () -> studentService.setCvAsPublic(dummyStudent, 10L));
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingPublicForNullStudent() {
        assertThrows(UserNotFoundException.class, () -> studentService.setCvAsPublic(null, 10L));
    }

    @Test
    void shouldSetCvAsPrivate() throws UserNotFoundException, CVAlredyPrivateException, CvNotFoundException {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PUBLIC);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        studentService.setCvAsPrivate(dummyStudent, 10L);

        assert CVSharingScope.PRIVATE.equals(cv.getSharingScope());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCVAlredyPrivateExceptionWhenCvIsAlreadyPrivate() {
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PRIVATE);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(CVAlredyPrivateException.class, () -> studentService.setCvAsPrivate(dummyStudent, 10L));
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingPrivateForNullStudent() {
        assertThrows(UserNotFoundException.class, () -> studentService.setCvAsPrivate(null, 10L));
    }

    @Test
    void shouldSetCVAsSecondary() throws UserNotFoundException, CvNotFoundException {
        // Arrange
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setPriority(CvPriority.MAIN);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        // Act
        studentService.setCVAsSecondary(dummyStudent, 10L);

        // Assert
        assert CvPriority.SECONDARY.equals(cv.getPriority());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingSecondaryForNullStudent() {
        assertThrows(UserNotFoundException.class, () -> studentService.setCVAsSecondary(null, 10L));
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingSecondaryForDifferentStudent() {
        Student otherStudent = new Student();
        otherStudent.setId(99L);

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(otherStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(UserNotFoundException.class, () -> studentService.setCVAsSecondary(dummyStudent, 10L));
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingSecondaryForNonExistentCv() {
        when(cvRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsSecondary(dummyStudent, 999L));
    }

    @Test
    void shouldSetCVAsMainWhenNoExistingMainCv() throws UserNotFoundException, CvNotFoundException {
        // Arrange
        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setPriority(CvPriority.SECONDARY);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));
        when(cvRepository.findByStudentAndPriority(dummyStudent, CvPriority.MAIN)).thenReturn(null);

        // Act
        studentService.setCVAsMain(dummyStudent, 10L);

        // Assert
        assert CvPriority.MAIN.equals(cv.getPriority());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldDemoteExistingMainCvAndPromoteNewCvToMain() throws UserNotFoundException, CvNotFoundException {
        // Arrange
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

        // Act
        studentService.setCVAsMain(dummyStudent, 10L);

        // Assert
        assert CvPriority.SECONDARY.equals(currentMainCv.getPriority());
        verify(cvRepository).save(currentMainCv);
    }

    @Test
    void shouldNotChangePriorityWhenCvIsAlreadyMain() throws UserNotFoundException, CvNotFoundException {
        // Arrange
        CV currentMainCv = new CV();
        currentMainCv.setId(10L);
        currentMainCv.setStudent(dummyStudent);
        currentMainCv.setPriority(CvPriority.MAIN);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(currentMainCv));
        when(cvRepository.findByStudentAndPriority(dummyStudent, CvPriority.MAIN)).thenReturn(currentMainCv);

        // Act
        studentService.setCVAsMain(dummyStudent, 10L);

        // Assert
        assert CvPriority.MAIN.equals(currentMainCv.getPriority());
        verify(cvRepository, times(1)).save(currentMainCv);
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingMainForNullStudent() {
        assertThrows(UserNotFoundException.class, () -> studentService.setCVAsMain(null, 10L));
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingMainForDifferentStudent() {
        Student otherStudent = new Student();
        otherStudent.setId(99L);

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(otherStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(UserNotFoundException.class, () -> studentService.setCVAsMain(dummyStudent, 10L));
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingMainForNonExistentCv() {
        when(cvRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsMain(dummyStudent, 999L));
    }
}