package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.repository.CVRepository;
import com.lacouf.rsbjwt.security.exception.CorruptedFileException;
import com.lacouf.rsbjwt.security.exception.InvalidFileTypeException;
import com.lacouf.rsbjwt.service.dto.CVDto;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.io.IOException;

@Service
public class CVService {
    private final CVRepository cvRepository;

    private final Tika tika = new Tika();

    public CVService(CVRepository cvRepository) {
        this.cvRepository = cvRepository;
    }

    public void saveCV(CVDto cvDto, Student student) throws CorruptedFileException, InvalidFileTypeException {
        String fileType = tika.detect(cvDto.getContent());
        if (!"application/pdf".equals(fileType)) {
            throw new InvalidFileTypeException("Invalid file type. Only PDF files are allowed.");
        }

        try {
            assert cvDto.getContent() != null;
            try (PDDocument document = PDDocument.load(cvDto.getContent())) {
                //
            }
        } catch (IOException e) {
            throw new CorruptedFileException("The PDF file is corrupted or unreadable.");
        }

        CV cv = new CV();
        cv = cvDto.toCV();
        cv.setStudent(student);
        cv.setFileHash(DigestUtils.md5DigestAsHex(cvDto.getContent()));
        cvRepository.save(cv);
    }

    public CVDto getCVById(Long id) throws CorruptedFileException {
        CV cv = cvRepository.findById(id).orElse(null);
        if (cv != null && !isFileReadable(cv)) {
            throw new CorruptedFileException("File integrity check failed. The file may have been tampered with.");
        }
        assert cv != null;
        return CVDto.fromCV(cv);
    }

    public boolean isFileReadable(CV cv) {
        String hash = DigestUtils.md5DigestAsHex(cv.getContent());
        return hash.equals(cv.getFileHash());
    }

    public CVDto getCVByStudent(Student student) throws CorruptedFileException {
        if (student == null || student.getCv() == null) {
            throw new CorruptedFileException("No CV found for the given student.");
        }
        return CVDto.fromCV(student.getCv());
    }
}
