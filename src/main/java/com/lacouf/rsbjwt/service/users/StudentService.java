package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.cv.CVRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.tika.Tika;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class StudentService {
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;
    private final CVRepository cvRepository;
    private final ManagerRepository managerRepository;
    private final NotificationService notificationService;

    private final int MAX_FILE_SIZE = 2 * 1024 * 1024; //2MB

    private final Tika tika = new Tika();

    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, CVRepository cvRepository, ManagerRepository managerRepository, NotificationService notificationService) {
        this.cvRepository = cvRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
        this.managerRepository = managerRepository;
        this.notificationService = notificationService;
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

    @Transactional
    public void uploadCV(CvUploadDto upload, String email) throws UserNotFoundException, InvalidFileTypeException, InvalidFileSizeException, NoSuchAlgorithmException, CorruptedFileException {
        Student student = findByEmail(email);

        saveCV(upload, student);
    }

    @Transactional
    public void saveCV(CvUploadDto upload, Student student) throws InvalidFileTypeException, InvalidFileSizeException, NoSuchAlgorithmException, CorruptedFileException {
        verifyFileSize(upload.content());

        if (!"application/pdf".equals(tika.detect(upload.content()))) {
            throw new InvalidFileTypeException("Invalid file type. Only PDF files are allowed.");
        }

        CV cv = new CV(upload.content(), CvVisibility.VISIBLE, upload.fileName(), LocalDateTime.now());

        cv.setStudent(student);

        cv.setFileHash(calculateFileHash(cv.getContent()));

        if (!isCVReadable(cv)) {
            throw new CorruptedFileException("The PDF file is corrupted or unreadable.");
        }

        CV savedCv = cvRepository.save(cv);

        notifyManagersOfSubmittedCv(savedCv);
    }

    public boolean isCVReadable(CV cv) throws NoSuchAlgorithmException {
        if (cv == null) {
            return false;
        }
        if (cv.getContent() == null || cv.getContent().length == 0) {
            return false;
        }
        String hash = calculateFileHash(cv.getContent());

        if (!hash.equals(cv.getFileHash())) {
            return false;
        }
        try (PDDocument document = Loader.loadPDF(cv.getContent())) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public long getCVCount(String email) throws UserNotFoundException {
        return cvRepository.countByStudentAndVisibility(findByEmail(email), CvVisibility.VISIBLE);
    }

    public List<StudentCvResponseDto> getCVs(String email) throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {
        List<CV> cvs = cvRepository.findByStudent(findByEmail(email));
        List<StudentCvResponseDto> studentCvResponseDtos = new ArrayList<>();
        for (CV cv : cvs) {
            if (!isCVReadable(cv)) {
                throw new CorruptedFileException("The CV with ID " + cv.getId() + " is corrupted or unreadable.");
            }
            if (!cv.getVisibility().equals(CvVisibility.VISIBLE)) {
                continue;
            }
            studentCvResponseDtos.add(StudentCvResponseDto.of(cv));
        }
        return studentCvResponseDtos;
    }

    public Integer getMaxCVSize() {
        return MAX_FILE_SIZE;
    }

    @Transactional
    public void setCvAsInvisible(String email, long cvId) throws CvNotFoundException {
        CV cv = findStudentCv(email, cvId);
        cv.setVisibility(CvVisibility.HIDDEN);
        cvRepository.save(cv);

        closeCvNotifications(cvId);
    }

    public CvFileResponseDto getCV(String email, long cvId) throws CvNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        CV cv = findStudentCv(email, cvId);
        if (!isCVReadable(cv)) {
            throw new CorruptedFileException("The CV with ID " + cv.getId() + " is corrupted or unreadable.");
        }
        return CvFileResponseDto.of(cv);
    }

    public String getCVStatus(String email, long cvId) throws CvNotFoundException {
        CV cv = findStudentCv(email, cvId);
        return cv.getStatus().name();
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

    private void verifyFileSize(byte[] content) throws InvalidFileTypeException, InvalidFileSizeException {
        if (content == null || content.length == 0) {
            throw new InvalidFileTypeException("File content cannot be null or empty.");
        }
        if (content.length > MAX_FILE_SIZE) {
            throw new InvalidFileSizeException("File size exceeds the maximum allowed size of " + MAX_FILE_SIZE + " bytes.");
        }
    }

    private void notifyManagersOfSubmittedCv(CV cv) {
        managerRepository.findAll()
                .forEach(manager -> notificationService.notifyIfAbsent(NotificationType.CV_SUBMITTED_FOR_REVIEW, cv.getId(), manager));
    }

    private void closeCvNotifications(long cvId) {
        notificationService.closeNotificationsOfTarget(TargetType.CV, cvId);
    }

    private String calculateFileHash(byte[] content) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(content);
        return HexFormat.of().formatHex(hashBytes);
    }

    private Student findByEmail(String email) throws UserNotFoundException {
        return studentRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);
    }

    private CV findStudentCv(String email, long cvId) throws CvNotFoundException {
        return cvRepository.findByIdAndStudent_Credentials_Email(cvId, email).orElseThrow(() -> new CvNotFoundException("CV with ID " + cvId + " not found."));
    }
}