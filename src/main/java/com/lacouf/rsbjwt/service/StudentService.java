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
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.tika.Tika;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class StudentService {
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;
    private final CVRepository cvRepository;

    private final int MAX_FILE_SIZE = 2 * 1024 * 1024; //2MB

    private final Tika tika = new Tika();


    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, CVRepository cvRepository) {
        this.cvRepository = cvRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
    }

    public UserResponseDto save(StudentSignUpDto studentSignUpDto) throws UserAlreadyExistsException {
        verifyIfStudentExists(studentSignUpDto.email(), studentSignUpDto.studentId());

        Credentials credentials = Credentials.builder()
                .email(studentSignUpDto.email())
                .password(passwordEncoder.encode(studentSignUpDto.password()))
                .role(Role.STUDENT)
                .build();

        Student student = new Student(
                studentSignUpDto.firstName(),
                studentSignUpDto.lastName(),
                studentSignUpDto.studentId(),
                credentials,
                studentSignUpDto.discipline()
        );

        studentRepository.save(student);

        return UserResponseDto.of(student);
    }

    private void verifyIfStudentExists(String email, String studentId) throws UserAlreadyExistsException {
        Optional<UserApp> studentFoundByEmail = userAppRepository.findByCredentialsEmail(email);
        Optional<Student> studentFoundByStudentId = studentRepository.findByStudentId(studentId);

        if (studentFoundByEmail.isPresent()) {
            throw new UserAlreadyExistsException("email");
        }

        if (studentFoundByStudentId.isPresent()) {
            throw new UserAlreadyExistsException("studentId");
        }
    }

    public Student findById(Long id) throws UserNotFoundException {
        return studentRepository.findById(id)
                .orElseThrow(UserNotFoundException::new);
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

        try (PDDocument document = Loader.loadPDF(cvDto.content())) {
        } catch (IOException e) {
            throw new CorruptedFileException("The PDF file is corrupted or unreadable.");
        }

        CV cv = cvDto.toCV();
        cv.setFileName(cvDto.fileName());
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
        try (PDDocument document = Loader.loadPDF(cv.getContent())) {
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



    public List<CVDto> getCVs(Student student) throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {
        if (student == null) {
            throw new UserNotFoundException();
        }
        List<CV> cvs = cvRepository.findByStudent_StudentId(student.getStudentId());
        List<CVDto> cvDtos = new ArrayList<>();
        for (CV cv : cvs) {
            if (!isCVReadable(cv)) {
                throw new CorruptedFileException("The CV with ID " + cv.getId() + " is corrupted or unreadable.");
            }
            if (!cv.getVisibility().equals(CvVisibility.VISIBLE)) {
                continue;
            }
            cvDtos.add(CVDto.fromCV(cv));
        }
        return cvDtos;
    }

    public Integer getMaxCVSize() {
        return MAX_FILE_SIZE;
    }

    public void setCvAsInvisible(Student student, Long cvId) throws UserNotFoundException {
        if (student == null) {
            throw new UserNotFoundException();
        }
        CV cv = cvRepository.findById(cvId).orElse(null);
        if (cv != null && cv.getStudent().getStudentId().equals(student.getStudentId())) {
            cv.setVisibility(CvVisibility.HIDDEN);
            cvRepository.save(cv);
        } else {
            throw new UserNotFoundException();
        }
    }

    public void setCvAsPublic(Student student, Long cvId) throws UserNotFoundException, CVAlreadyPublicException {
        if (student == null) {
            throw new UserNotFoundException();
        }
        CV cv = cvRepository.findById(cvId).orElse(null);
        if (cv != null && cv.getStudent().getStudentId().equals(student.getStudentId())) {
            if (cv.getSharingScope().equals(CVSharingScope.PUBLIC)) {
                throw new CVAlreadyPublicException("The CV with ID " + cvId + " is already public.");
            }
            cv.setSharingScope(CVSharingScope.PUBLIC);
            cvRepository.save(cv);
        } else {
            throw new UserNotFoundException();
        }
    }

    public void setCvAsPrivate(Student student, Long cvId) throws UserNotFoundException, CVAlredyPrivateException {
        if (student == null) {
            throw new UserNotFoundException();
        }
        CV cv = cvRepository.findById(cvId).orElse(null);
        if (cv != null && cv.getStudent().getStudentId().equals(student.getStudentId())) {
            if (cv.getSharingScope().equals(CVSharingScope.PRIVATE)) {
                throw new CVAlredyPrivateException("The CV with ID " + cvId + " is already private.");
            }
            cv.setSharingScope(CVSharingScope.PRIVATE);
            cvRepository.save(cv);
        } else {
            throw new UserNotFoundException();
        }
    }
}