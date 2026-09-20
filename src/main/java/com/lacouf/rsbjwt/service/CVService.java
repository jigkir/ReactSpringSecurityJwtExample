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
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class CVService {
    private static final int MAX_FILE_SIZE = 2 * 1024 * 1024;

    private final CVRepository cvRepository;

    private final Tika tika = new Tika();

    public CVService(CVRepository cvRepository) {
        this.cvRepository = cvRepository;
    }

    public void saveCV(CVDto cvDto, Student student) throws CorruptedFileException, InvalidFileTypeException, NoSuchAlgorithmException, InvalidFileSizeException {

        if (cvDto.content() == null || cvDto.content().length == 0) {
            throw new InvalidFileTypeException("File content cannot be null or empty.");
        }

        if (cvDto.content().length > MAX_FILE_SIZE) {
            throw new InvalidFileSizeException("File size exceeds the maximum allowed size of " + MAX_FILE_SIZE + " bytes.");
        }

        String mimeType = tika.detect(cvDto.content());
        if (!"application/pdf".equals(mimeType)) {
            throw new InvalidFileTypeException("Invalid file type. Only PDF files are allowed.");
        }

        try (PDDocument document = PDDocument.load(cvDto.content())) {
        } catch (IOException e) {
            throw new CorruptedFileException("The PDF file is corrupted or unreadable.");
        }

        CV cv = cvDto.toCV();
        cv.setStudent(student);
        cv.setUploadDate(LocalDateTime.now());
        student.addCv(cv);

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(cvDto.getContent());
        String hash = HexFormat.of().formatHex(hashBytes);
        cv.setFileHash(hash);

        cvRepository.save(cv);
    }

    public boolean isCVReadable(CV cv) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(cv.getContent());
        String hash = HexFormat.of().formatHex(hashBytes);

        if (!hash.equals(cv.getFileHash())) {
            return false;
        }
        try (PDDocument document = PDDocument.load(cv.getContent())) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public long getCVCountByStudent(Student student) {
        if (student == null) {
            return 0;
        }
        return cvRepository.countByStudent_StudentId(student.getStudentId());
    }



    public CVDto getMostRecentCVByStudent(Student student) throws CorruptedFileException, NoSuchAlgorithmException, UserNotFoundException {
        if (student == null) {
            throw new UserNotFoundException();
        }
        CV mostRecentCV = cvRepository.findTopByStudent_StudentIdOrderByUploadDateDesc(student.getStudentId())
                .orElseThrow(() -> new CorruptedFileException("No CV found for the given student."));

        if (!isCVReadable(mostRecentCV)) {
            throw new CorruptedFileException("The CV for the given student is corrupted or unreadable.");
        }


        return CVDto.fromCV(mostRecentCV);
    }

    public Integer getMaxCVSize() {
        return MAX_FILE_SIZE;
    }
}
