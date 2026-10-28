package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.document.CorruptedFileException;
import com.lacouf.rsbjwt.exception.document.EmptyFileException;
import com.lacouf.rsbjwt.exception.document.InvalidFileSizeException;
import com.lacouf.rsbjwt.exception.document.InvalidFileTypeException;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.document.student.coverletter.CoverLetter;
import com.lacouf.rsbjwt.repository.document.student.coverletter.CoverLetterRepository;
import com.lacouf.rsbjwt.service.document.DocumentService;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.StudentDocumentResponseDto;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentServiceTest {

    private static final String STUDENT_EMAIL = "test@claurendeau.qc.ca";
    private static final int MAX_FILE_SIZE = 2 * 1024 * 1024;

    private static byte[] validPdfBytes;

    private final DocumentService documentService = new DocumentService();

    @Mock
    private CoverLetterRepository coverLetterRepository;

    @BeforeAll
    static void createValidPdf() throws IOException {
        try (
                PDDocument doc = new PDDocument();
                ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()
        ) {
            doc.addPage(new PDPage());
            doc.save(byteArrayOutputStream);
            validPdfBytes = byteArrayOutputStream.toByteArray();
        }
    }

    // ==========================================
    // Save Tests
    // ==========================================

    @Test
    void shouldSaveDocumentWithItsHashWhenPdfIsValid() throws Exception {
        // Arrange
        CoverLetter coverLetter = coverLetterWithContent(validPdfBytes);

        when(coverLetterRepository.save(coverLetter)).then(returnsFirstArg());

        // Act
        CoverLetter savedCoverLetter = documentService.save(coverLetter, coverLetterRepository);

        // Assert
        assert calculateHash(validPdfBytes).equals(savedCoverLetter.getFileHash());

        verify(coverLetterRepository).save(coverLetter);
    }

    @Test
    void shouldThrowEmptyFileExceptionWhenSavingDocumentWithoutContent() {
        // Arrange
        CoverLetter coverLetter = coverLetterWithContent(null);

        // Act + Assert
        assertThrows(EmptyFileException.class, () -> documentService.save(coverLetter, coverLetterRepository));

        verifyNoInteractions(coverLetterRepository);
    }

    @Test
    void shouldThrowEmptyFileExceptionWhenSavingEmptyDocument() {
        // Arrange
        CoverLetter coverLetter = coverLetterWithContent(new byte[0]);

        // Act + Assert
        assertThrows(EmptyFileException.class, () -> documentService.save(coverLetter, coverLetterRepository));

        verifyNoInteractions(coverLetterRepository);
    }

    @Test
    void shouldThrowInvalidFileSizeExceptionWhenSavingTooLargeDocument() {
        // Arrange
        CoverLetter coverLetter = coverLetterWithContent(new byte[MAX_FILE_SIZE + 1]);

        // Act + Assert
        assertThrows(InvalidFileSizeException.class, () -> documentService.save(coverLetter, coverLetterRepository));

        verifyNoInteractions(coverLetterRepository);
    }

    @Test
    void shouldThrowInvalidFileTypeExceptionWhenSavingDocumentThatIsNotPdf() {
        // Arrange
        CoverLetter coverLetter = coverLetterWithContent("Hello World".getBytes());

        // Act + Assert
        assertThrows(InvalidFileTypeException.class, () -> documentService.save(coverLetter, coverLetterRepository));

        verifyNoInteractions(coverLetterRepository);
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenSavingUnreadablePdf() {
        // Arrange
        CoverLetter coverLetter = coverLetterWithContent("%PDF-1.4 Fake PDF Content That Cannot Be Parsed".getBytes());

        // Act + Assert
        assertThrows(CorruptedFileException.class, () -> documentService.save(coverLetter, coverLetterRepository));

        verifyNoInteractions(coverLetterRepository);
    }

    // ==========================================
    // Read Tests
    // ==========================================

    @Test
    void shouldGetVisibleDocumentsOfStudent() throws Exception {
        // Arrange
        CoverLetter coverLetter = readableCoverLetter();

        when(coverLetterRepository.findByUser_Credentials_EmailAndVisibility(STUDENT_EMAIL, DocumentVisibility.VISIBLE)).thenReturn(List.of(coverLetter));

        // Act
        List<StudentDocumentResponseDto> documents = documentService.getVisibleDocuments(STUDENT_EMAIL, coverLetterRepository);

        // Assert
        assert documents.size() == 1;
        assert documents.getFirst().id() == 20L;
        assert "lettre_de_recommandation.pdf".equals(documents.getFirst().fileName());
        assert documents.getFirst().sizeBytes() == validPdfBytes.length;
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenAVisibleDocumentIsCorrupted() {
        // Arrange
        CoverLetter corruptedCoverLetter = coverLetterWithContent("Corrupted".getBytes());
        corruptedCoverLetter.setFileHash("badhash");

        when(coverLetterRepository.findByUser_Credentials_EmailAndVisibility(STUDENT_EMAIL, DocumentVisibility.VISIBLE)).thenReturn(List.of(corruptedCoverLetter));

        // Act + Assert
        assertThrows(CorruptedFileException.class, () -> documentService.getVisibleDocuments(STUDENT_EMAIL, coverLetterRepository));
    }

    @Test
    void shouldGetFileWhenDocumentIsReadable() throws Exception {
        // Arrange
        CoverLetter coverLetter = readableCoverLetter();

        // Act
        DocumentFileResponseDto file = documentService.getFile(coverLetter);

        // Assert
        assert file.id() == 20L;
        assert "lettre_de_recommandation.pdf".equals(file.fileName());
    }

    @Test
    void shouldThrowCorruptedFileExceptionWhenGettingFileOfCorruptedDocument() {
        // Arrange
        CoverLetter corruptedCoverLetter = coverLetterWithContent("Corrupted".getBytes());
        corruptedCoverLetter.setFileHash("badhash");

        // Act + Assert
        assertThrows(CorruptedFileException.class, () -> documentService.getFile(corruptedCoverLetter));
    }

    @Test
    void shouldGetMaxFileSize() {
        // Act + Assert
        assert documentService.getMaxFileSize() == MAX_FILE_SIZE;
    }

    // ==========================================
    // Readability Tests
    // ==========================================

    @Test
    void shouldReturnTrueWhenDocumentIsReadable() throws NoSuchAlgorithmException {
        // Act
        boolean readable = documentService.isReadable(readableCoverLetter());

        // Assert
        assert readable;
    }

    @Test
    void shouldReturnFalseWhenDocumentHashDoesNotMatch() throws NoSuchAlgorithmException {
        // Arrange
        CoverLetter coverLetter = coverLetterWithContent(validPdfBytes);
        coverLetter.setFileHash("invalid_hash_string");

        // Act
        boolean readable = documentService.isReadable(coverLetter);

        // Assert
        assert !readable;
    }

    @Test
    void shouldReturnFalseWhenDocumentContentIsNotAPdf() throws NoSuchAlgorithmException {
        // Arrange
        byte[] fakeBytes = "Corrupted Data".getBytes();
        CoverLetter coverLetter = coverLetterWithContent(fakeBytes);
        coverLetter.setFileHash(calculateHash(fakeBytes));

        // Act
        boolean readable = documentService.isReadable(coverLetter);

        // Assert
        assert !readable;
    }

    @Test
    void shouldReturnFalseWhenDocumentIsNull() throws NoSuchAlgorithmException {
        // Act
        boolean readable = documentService.isReadable(null);

        // Assert
        assert !readable;
    }

    @Test
    void shouldReturnFalseWhenDocumentContentIsEmpty() throws NoSuchAlgorithmException {
        // Act
        boolean readable = documentService.isReadable(coverLetterWithContent(new byte[0]));

        // Assert
        assert !readable;
    }

    // ---------- Helpers ----------

    private CoverLetter coverLetterWithContent(byte[] content) {
        CoverLetter coverLetter = new CoverLetter(content, "lettre_de_recommandation.pdf", LocalDateTime.now());
        coverLetter.setId(20L);

        return coverLetter;
    }

    private CoverLetter readableCoverLetter() throws NoSuchAlgorithmException {
        CoverLetter coverLetter = coverLetterWithContent(validPdfBytes);
        coverLetter.setFileHash(calculateHash(validPdfBytes));

        return coverLetter;
    }

    private static String calculateHash(byte[] bytes) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(bytes);

        return HexFormat.of().formatHex(hashBytes);
    }
}