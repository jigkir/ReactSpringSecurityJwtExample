package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyExistsException;
import com.lacouf.rsbjwt.exception.application.DeadlineAlreadyPassedException;
import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.application.InternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class StudentService {
    private static final String STUDENT_ID_FIELD = "studentId";

    private final StudentRepository studentRepository;
    private final UserAppService userAppService;
    private final CVRepository cvRepository;
    private final ManagerRepository managerRepository;
    private final NotificationService notificationService;
    private final InternshipRepository internshipRepository;
    private final InternshipApplicationRepository applicationRepository;

    private final int MAX_FILE_SIZE = 2 * 1024 * 1024; //2MB

    private final Tika tika = new Tika();

    public StudentService(StudentRepository studentRepository, UserAppService userAppService, CVRepository cvRepository, ManagerRepository managerRepository, NotificationService notificationService, InternshipRepository internshipRepository, InternshipApplicationRepository applicationRepository) {
        this.userAppService = userAppService;
        this.cvRepository = cvRepository;
        this.studentRepository = studentRepository;
        this.managerRepository = managerRepository;
        this.notificationService = notificationService;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
    }

    public UserResponseDto save(StudentSignUpDto studentSignUpDto) throws UserAlreadyExistsException {
        Credentials credentials = userAppService.createCredentials(studentSignUpDto.email(), studentSignUpDto.password(), Role.STUDENT);

        verifyIfStudentIdIsAlreadyUsed(studentSignUpDto.studentId());

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
        // Unnamed variable: loading the PDF is the check itself, the document is never used
        try (PDDocument _ = Loader.loadPDF(cv.getContent())) {
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

    public List<StudentCvResponseDto> getApprovedCVs(String email) {
        List<CV> cvs = cvRepository.findByStudentEmailAndStatus(email, ReviewStatus.APPROVED.name());
        List<StudentCvResponseDto> approvedCvResponseDtos = new ArrayList<>();
        for (CV cv : cvs) {
            approvedCvResponseDtos.add(StudentCvResponseDto.of(cv));
        }
        return approvedCvResponseDtos;
    }

    public void applyToInternship(String email, long cvId, long internshipId) throws UserNotFoundException, CvNotFoundException, InternshipNotFoundException, CVNotApprovedException, ApplicationAlreadyExistsException, DeadlineAlreadyPassedException {
        Student student = findByEmail(email);
        CV cv = findStudentCv(email, cvId);
        Internship internship = internshipRepository.findById(internshipId).orElseThrow(() -> new InternshipNotFoundException(internshipId));

        if (!cv.getStatus().equals(ReviewStatus.APPROVED)) {
            throw new CVNotApprovedException("CV is not approved for application");
        }

        if (hasStudentAlreadyAppliedToInternship(student, internship)) {
            throw new ApplicationAlreadyExistsException("Student has already applied to this internship");
        }

        if (LocalDate.now().isAfter(internship.getApplicationDeadline())) {
            throw new DeadlineAlreadyPassedException("Application deadline has passed");
        }

        InternshipApplication application = new InternshipApplication(internship, cv, student);
        applicationRepository.save(application);
    }

    public List<InternshipApplicationResponseDto> getInternshipApplications(String email) throws UserNotFoundException {
        Student student = findByEmail(email);
        List<InternshipApplication> applications = applicationRepository.findByStudent(student);
        List<InternshipApplicationResponseDto> applicationResponses = new ArrayList<>();
        for (InternshipApplication application : applications) {
            applicationResponses.add(InternshipApplicationResponseDto.of(application.getId(), CvFileResponseDto.of(application.getCv()), application.getApplicationDate()));
        }
        return applicationResponses;
    }

    private boolean hasStudentAlreadyAppliedToInternship(Student student, Internship internship) {
        return applicationRepository.findByStudent(student).stream()
                .anyMatch(application -> application.getInternship().equals(internship));
    }

    private void verifyIfStudentIdIsAlreadyUsed(String studentId) throws UserAlreadyExistsException {
        Optional<Student> student = studentRepository.findByStudentId(studentId);

        if (student.isPresent()) {
            throw new UserAlreadyExistsException(STUDENT_ID_FIELD);
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
        return cvRepository.findByIdAndStudent_Credentials_Email(cvId, email).orElseThrow(() -> new CvNotFoundException(cvId));
    }

    private List<Internship> findInternships(Student student) {
        return internshipRepository.findByPostedBy_DisciplineAndDeletedIsFalse(student.getDiscipline());
    }

    public List<InternshipResponseDto> getInternships(String email) throws UserNotFoundException {
        Student student = findByEmail(email);
        List<Internship> internships = findInternships(student);
        List<InternshipResponseDto> internshipResponses = new ArrayList<>();
        for (Internship internship : internships) {
            if (!internship.getStatus().equals(ReviewStatus.APPROVED)) {
                continue;
            }
            if (LocalDate.now().isAfter(internship.getApplicationDeadline())) {
                continue;
            }
            internshipResponses.add(InternshipResponseDto.of(internship));
        }
        return internshipResponses;
    }
}