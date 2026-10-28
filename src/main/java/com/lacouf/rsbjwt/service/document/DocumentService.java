package com.lacouf.rsbjwt.service.document;

import com.lacouf.rsbjwt.exception.document.CorruptedFileException;
import com.lacouf.rsbjwt.exception.document.EmptyFileException;
import com.lacouf.rsbjwt.exception.document.InvalidFileSizeException;
import com.lacouf.rsbjwt.exception.document.InvalidFileTypeException;
import com.lacouf.rsbjwt.model.documents.Document;
import com.lacouf.rsbjwt.model.documents.DocumentVisibility;
import com.lacouf.rsbjwt.repository.document.DocumentRepository;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.StudentDocumentResponseDto;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Service
public class DocumentService {

    private static final String PDF_MIME_TYPE = "application/pdf";
    private static final String HASH_ALGORITHM = "SHA-256";
    private static final int MAX_FILE_SIZE = 2 * 1024 * 1024; //2MB

    private final Tika tika = new Tika();

    public <T extends Document> T save(T document, DocumentRepository<T> repository) throws EmptyFileException, InvalidFileSizeException, InvalidFileTypeException, CorruptedFileException, NoSuchAlgorithmException {
        verifyFileSize(document.getContent());
        verifyFileType(document.getContent());

        document.setFileHash(calculateFileHash(document.getContent()));

        verifyIsReadable(document);

        return repository.save(document);
    }

    public <T extends Document> List<StudentDocumentResponseDto> getVisibleDocuments(String email, DocumentRepository<T> repository) throws CorruptedFileException, NoSuchAlgorithmException {
        List<StudentDocumentResponseDto> documents = new ArrayList<>();

        for (T document : repository.findByUser_Credentials_EmailAndVisibility(email, DocumentVisibility.VISIBLE)) {
            verifyIsReadable(document);

            documents.add(StudentDocumentResponseDto.of(document));
        }

        return documents;
    }

    public DocumentFileResponseDto getFile(Document document) throws CorruptedFileException, NoSuchAlgorithmException {
        verifyIsReadable(document);

        return DocumentFileResponseDto.of(document);
    }

    public boolean isReadable(Document document) throws NoSuchAlgorithmException {
        if (document == null) {
            return false;
        }

        if (document.getContent() == null || document.getContent().length == 0) {
            return false;
        }

        String hash = calculateFileHash(document.getContent());

        if (!hash.equals(document.getFileHash())) {
            return false;
        }

        try (PDDocument _ = Loader.loadPDF(document.getContent())) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public int getMaxFileSize() {
        return MAX_FILE_SIZE;
    }

    private void verifyIsReadable(Document document) throws CorruptedFileException, NoSuchAlgorithmException {
        if (!isReadable(document)) {
            throw new CorruptedFileException();
        }
    }

    private void verifyFileSize(byte[] content) throws InvalidFileSizeException, EmptyFileException {
        if (content == null || content.length == 0) {
            throw new EmptyFileException();
        }

        if (content.length > MAX_FILE_SIZE) {
            throw new InvalidFileSizeException(MAX_FILE_SIZE);
        }
    }

    private void verifyFileType(byte[] content) throws InvalidFileTypeException {
        if (!PDF_MIME_TYPE.equals(tika.detect(content))) {
            throw new InvalidFileTypeException();
        }
    }

    private String calculateFileHash(byte[] content) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
        byte[] hashBytes = digest.digest(content);

        return HexFormat.of().formatHex(hashBytes);
    }
}
