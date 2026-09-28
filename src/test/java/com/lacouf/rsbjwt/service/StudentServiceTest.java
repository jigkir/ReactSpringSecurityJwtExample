package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.CVRepository;
import com.lacouf.rsbjwt.repository.StudentRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.response.CVDto;
import com.lacouf.rsbjwt.service.dto.request.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.UserResponseDto;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.tika.Tika;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
        CVDto cvDto = new CVDto(validPdfBytes, null, CVSharingScope.PRIVATE, "cv.pdf", validPdfBytes.length, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE, CvStatus.PENDING);

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
        CVDto cvDto = new CVDto(null, null, CVSharingScope.PRIVATE, "cv.pdf", 0, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE, CvStatus.PENDING);

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
        );

        assert "File content cannot be null or empty.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenContentIsEmpty() {
        CVDto cvDto = new CVDto(new byte[0], null, CVSharingScope.PRIVATE, "cv.pdf", 0, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE, CvStatus.PENDING);

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
        );

        assert "File content cannot be null or empty.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowInvalidFileSizeExceptionWhenFileExceedsMaxSize() {
        byte[] oversizedContent = new byte[2 * 1024 * 1024 + 1];
        CVDto cvDto = new CVDto(oversizedContent, null, CVSharingScope.PRIVATE, "large.pdf", oversizedContent.length, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE, CvStatus.PENDING);

        assertThrows(
                InvalidFileSizeException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
        );
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenMimeTypeIsNotPdf() {
        byte[] textFileBytes = "Hello World".getBytes();
        CVDto cvDto = new CVDto(textFileBytes, null, CVSharingScope.PRIVATE, "file.txt", textFileBytes.length, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE, CvStatus.PENDING);

        InvalidFileTypeException exception = assertThrows(
                InvalidFileTypeException.class,
                () -> studentService.saveCV(cvDto, dummyStudent)
        );

        assert "Invalid file type. Only PDF files are allowed.".equals(exception.getMessage());
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenPdfIsCorrupted() {
        byte[] corruptedPdfBytes = "%PDF-1.4 Fake PDF Content That Cannot Be Parsed".getBytes();
        CVDto cvDto = new CVDto(corruptedPdfBytes, null, CVSharingScope.PRIVATE, "corrupted.pdf", corruptedPdfBytes.length, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE, CvStatus.PENDING);

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
    void shouldGetCVCountByStudent() throws UserNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.countByStudent(dummyStudent)).thenReturn(3L);

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

        List<CVDto> cvs = studentService.getCVs(dummyStudent.getId());

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

        List<CVDto> cvs = studentService.getCVs(dummyStudent.getId());

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
    }

    @Test
    void shouldThrowUserNotFoundExceptionWhenSettingInvisibleForDifferentStudent() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        Student existingStudent = new Student();
        existingStudent.setStudentId("9999999");

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(existingStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(UserNotFoundException.class, () -> studentService.setCvAsInvisible(dummyStudent.getId(), 10L));
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
    void shouldSetCvAsPrivate() throws UserNotFoundException, CVAlredyPrivateException, CvNotFoundException {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PUBLIC);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        studentService.setCvAsPrivate(dummyStudent.getId(), 10L);

        assert CVSharingScope.PRIVATE.equals(cv.getSharingScope());
        verify(cvRepository).save(cv);
    }

    @Test
    void shouldThrowCVAlredyPrivateExceptionWhenCvIsAlreadyPrivate() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(dummyStudent);
        cv.setSharingScope(CVSharingScope.PRIVATE);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(CVAlredyPrivateException.class, () -> studentService.setCvAsPrivate(dummyStudent.getId(), 10L));
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
    void shouldThrowUserNotFoundExceptionWhenSettingSecondaryForDifferentStudent() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        Student otherStudent = new Student();
        otherStudent.setId(99L);

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(otherStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(UserNotFoundException.class, () -> studentService.setCVAsSecondary(dummyStudent.getId(), 10L));
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
    void shouldThrowUserNotFoundExceptionWhenSettingMainForDifferentStudent() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));

        Student otherStudent = new Student();
        otherStudent.setId(99L);

        CV cv = new CV();
        cv.setId(10L);
        cv.setStudent(otherStudent);

        when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));

        assertThrows(UserNotFoundException.class, () -> studentService.setCVAsMain(dummyStudent.getId(), 10L));
    }

    @Test
    void shouldThrowCvNotFoundExceptionWhenSettingMainForNonExistentCv() {
        when(studentRepository.findById(dummyStudent.getId())).thenReturn(Optional.of(dummyStudent));
        when(cvRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(CvNotFoundException.class, () -> studentService.setCVAsMain(dummyStudent.getId(), 999L));
    }
}