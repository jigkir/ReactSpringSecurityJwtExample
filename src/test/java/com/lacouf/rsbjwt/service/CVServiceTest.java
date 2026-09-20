package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.repository.CVRepository;
import com.lacouf.rsbjwt.security.exception.CorruptedFileException;
import com.lacouf.rsbjwt.security.exception.InvalidFileSizeException;
import com.lacouf.rsbjwt.security.exception.InvalidFileTypeException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.CVDto;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CVServiceTest {

    @InjectMocks
    private CVService cvService;

    @Mock
    private CVRepository cvRepository;

    @Captor
    private ArgumentCaptor<CV> cvArgumentCaptor;

    private static CVDto cvDto;
    private static byte[] validPdfBytes;

    private Student student;
    private byte[] invalidTypeBytes;
    private byte[] corruptedPdfBytes;

    @BeforeAll
    static void setUpBeforeAll() throws IOException {
        try (PDDocument document = new PDDocument()) {
            document.addPage(new PDPage());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            validPdfBytes = baos.toByteArray();
        }
        cvDto = new CVDto(validPdfBytes);
    }

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(1L);
        student.setStudentId("1234567");

        invalidTypeBytes = "This is a plain text file, not a PDF.".getBytes();
        corruptedPdfBytes = "%PDF-1.4 corrupted PDF content that fails parsing".getBytes();
    }

    private String calculateHash(byte[] content) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(content));
    }

    @Nested
    class SaveCVTests {

        @Test
        void shouldSaveValidCV() throws Exception {
            // Act
            cvService.saveCV(cvDto, student);

            // Assert
            verify(cvRepository).save(cvArgumentCaptor.capture());
            CV capturedCv = cvArgumentCaptor.getValue();

            assert(capturedCv != null);
            assert(student).equals(capturedCv.getStudent());
            assert(capturedCv.getUploadDate() != null);
            assert(calculateHash(validPdfBytes)).equals(capturedCv.getFileHash());
        }

        @Test
        void shouldThrowInvalidFileTypeExceptionWhenContentIsNull() {
            // Arrange
            CVDto nullContentDto = new CVDto(null);

            // Act
            InvalidFileTypeException exception = assertThrows(
                    InvalidFileTypeException.class,
                    () -> cvService.saveCV(nullContentDto, student)
            );

            // Assert
            assert("File content cannot be null or empty.").equals(exception.getMessage());
            verify(cvRepository, never()).save(any());
        }

        @Test
        void shouldThrowInvalidFileTypeExceptionWhenContentIsEmpty() {
            // Arrange
            CVDto emptyContentDto = new CVDto(new byte[0]);

            // Act
            InvalidFileTypeException exception = assertThrows(
                    InvalidFileTypeException.class,
                    () -> cvService.saveCV(emptyContentDto, student)
            );

            // Assert
            assert("File content cannot be null or empty.").equals(exception.getMessage());
            verify(cvRepository, never()).save(any());
        }

        @Test
        void shouldThrowInvalidFileSizeExceptionWhenFileExceedsMaxSize() {
            // Arrange
            byte[] oversizedBytes = new byte[2 * 1024 * 1024 + 1];
            CVDto oversizedDto = new CVDto(oversizedBytes);

            // Act
            InvalidFileSizeException exception = assertThrows(
                    InvalidFileSizeException.class,
                    () -> cvService.saveCV(oversizedDto, student)
            );

            // Assert
            assert(exception.getMessage().contains("File size exceeds the maximum allowed size"));
            verify(cvRepository, never()).save(any());
        }

        @Test
        void shouldThrowInvalidFileTypeExceptionWhenFileIsNotPdf() {
            // Arrange
            CVDto invalidTypeDto = new CVDto(invalidTypeBytes);

            // Act
            InvalidFileTypeException exception = assertThrows(
                    InvalidFileTypeException.class,
                    () -> cvService.saveCV(invalidTypeDto, student)
            );

            // Assert
            assert("Invalid file type. Only PDF files are allowed.").equals(exception.getMessage());
            verify(cvRepository, never()).save(any());
        }

        @Test
        void shouldThrowCorruptedFileExceptionWhenPdfIsCorrupted() {
            // Arrange
            CVDto corruptedDto = new CVDto(corruptedPdfBytes);

            // Act
            CorruptedFileException exception = assertThrows(
                    CorruptedFileException.class,
                    () -> cvService.saveCV(corruptedDto, student)
            );

            // Assert
            assert("The PDF file is corrupted or unreadable.").equals(exception.getMessage());
            verify(cvRepository, never()).save(any());
        }
    }

    @Nested
    class IsCVReadableTests {

        @Test
        void shouldReturnTrueWhenCVIsReadableAndHashMatches() throws Exception {
            // Arrange
            CV cv = new CV();
            cv.setContent(validPdfBytes);
            cv.setFileHash(calculateHash(validPdfBytes));

            // Act
            boolean isReadable = cvService.isCVReadable(cv);

            // Assert
            assert(isReadable);
        }

        @Test
        void shouldReturnFalseWhenHashDoesNotMatch() throws Exception {
            // Arrange
            CV cv = new CV();
            cv.setContent(validPdfBytes);
            cv.setFileHash("tampered_hash_value");

            // Act
            boolean isReadable = cvService.isCVReadable(cv);

            // Assert
            assert(!isReadable);
        }

        @Test
        void shouldReturnFalseWhenPdfContentIsCorrupted() throws Exception {
            // Arrange
            CV cv = new CV();
            cv.setContent(corruptedPdfBytes);
            cv.setFileHash(calculateHash(corruptedPdfBytes));

            // Act
            boolean isReadable = cvService.isCVReadable(cv);

            // Assert
            assert(!isReadable);
        }
    }

    @Nested
    class GetCVCountByStudentTests {

        @Test
        void shouldReturnCountWhenStudentIsNotNull() {
            // Arrange
            when(cvRepository.countByStudent_StudentId("1234567")).thenReturn(3L);

            // Act
            long count = cvService.getCVCountByStudent(student);

            // Assert
            assert(count == 3L);
            verify(cvRepository).countByStudent_StudentId("1234567");
        }

    }

    @Nested
    class GetMostRecentCVByStudentTests {

        @Test
        void shouldThrowUserNotFoundExceptionWhenStudentIsNull() {
            // Act & Assert
            assertThrows(UserNotFoundException.class, () -> cvService.getMostRecentCVByStudent(null));
        }

        @Test
        void shouldThrowCorruptedFileExceptionWhenNoCVFound() {
            // Arrange
            when(cvRepository.findTopByStudent_StudentIdOrderByUploadDateDesc("1234567"))
                    .thenReturn(Optional.empty());

            // Act
            CorruptedFileException exception = assertThrows(
                    CorruptedFileException.class,
                    () -> cvService.getMostRecentCVByStudent(student)
            );

            // Assert
            assert("No CV found for the given student.").equals(exception.getMessage());
        }

        @Test
        void shouldThrowCorruptedFileExceptionWhenMostRecentCVIsUnreadable() throws Exception {
            // Arrange
            CV cv = new CV();
            cv.setContent(corruptedPdfBytes);
            cv.setFileHash(calculateHash(corruptedPdfBytes));

            when(cvRepository.findTopByStudent_StudentIdOrderByUploadDateDesc("1234567"))
                    .thenReturn(Optional.of(cv));

            // Act
            CorruptedFileException exception = assertThrows(
                    CorruptedFileException.class,
                    () -> cvService.getMostRecentCVByStudent(student)
            );

            // Assert
            assert("The CV for the given student is corrupted or unreadable.").equals(exception.getMessage());
        }

        @Test
        void shouldReturnMostRecentCVDtoWhenValid() throws Exception {
            // Arrange
            CV cv = new CV();
            cv.setContent(validPdfBytes);
            cv.setFileHash(calculateHash(validPdfBytes));

            when(cvRepository.findTopByStudent_StudentIdOrderByUploadDateDesc("1234567"))
                    .thenReturn(Optional.of(cv));

            // Act
            CVDto result = cvService.getMostRecentCVByStudent(student);

            // Assert
            assert(result != null);
            assert(Arrays.equals(validPdfBytes, result.content()));
        }
    }

    @Nested
    class GetMaxCVSizeTests {

        @Test
        void shouldReturnMaxCVSize() {
            // Act
            Integer maxSize = cvService.getMaxCVSize();

            // Assert
            assert(Integer.valueOf(2 * 1024 * 1024)).equals(maxSize);
        }
    }
}