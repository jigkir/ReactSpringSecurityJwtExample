package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyExistsException;
import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyReadException;
import com.lacouf.rsbjwt.exception.application.DeadlineAlreadyPassedException;
import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
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
import java.util.*;

@Service
public class StudentService {
    private static final String STUDENT_ID_FIELD = "studentId";
    private static final String PDF_MIME_TYPE = "application/pdf";

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
    public void uploadCV(CvUploadDto upload, String email) throws UserNotFoundException, InvalidFileTypeException, InvalidFileSizeException, NoSuchAlgorithmException, CorruptedFileException, EmptyFileException {
        Student student = findByEmail(email);

        saveCV(upload, student);
    }

    @Transactional
    public void saveCV(CvUploadDto upload, Student student) throws InvalidFileTypeException, InvalidFileSizeException, NoSuchAlgorithmException, CorruptedFileException, EmptyFileException {
        verifyFileSize(upload.content());

        if (!PDF_MIME_TYPE.equals(tika.detect(upload.content()))) {
            throw new InvalidFileTypeException();
        }

        CV cv = new CV(upload.content(), CvVisibility.VISIBLE, upload.fileName(), LocalDateTime.now());

        cv.setStudent(student);

        cv.setFileHash(calculateFileHash(cv.getContent()));

        if (!isCVReadable(cv)) {
            throw new CorruptedFileException();
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
                throw new CorruptedFileException();
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
            throw new CorruptedFileException();
        }
        return CvFileResponseDto.of(cv);
    }

    public String getCVStatus(String email, long cvId) throws CvNotFoundException {
        CV cv = findStudentCv(email, cvId);
        return cv.getStatus().name();
    }

    public List<StudentCvResponseDto> getApprovedAndVisibleCVs(String email) {
        List<CV> cvs = cvRepository.findByStudent_Credentials_EmailAndStatusAndVisibility(email, ReviewStatus.APPROVED, CvVisibility.VISIBLE);
        List<StudentCvResponseDto> approvedCvResponseDtos = new ArrayList<>();
        for (CV cv : cvs) {
            approvedCvResponseDtos.add(StudentCvResponseDto.of(cv));
        }
        return approvedCvResponseDtos;
    }

    @Transactional
    public void applyToInternship(String email, long cvId, long internshipId) throws UserNotFoundException, CvNotFoundException, InternshipNotFoundException, CVNotApprovedException, ApplicationAlreadyExistsException, DeadlineAlreadyPassedException, CVNotVisibleException {
        Student student = findByEmail(email);

        CV cv = validateCVForApplication(email, cvId);

        Internship internship = validateInternshipForApplication(internshipId, student.getDiscipline());

        if (applicationRepository.existsByStudentAndInternship(student, internship)) {
            throw new ApplicationAlreadyExistsException();
        }

        InternshipApplication application = new InternshipApplication(internship, cv, student);
        applicationRepository.save(application);

        student.markViewed(internship);
        studentRepository.save(student);

        notifyEmployerOfNewApplication(application);
    }

    @Transactional
    public void updateInternshipApplication(String email, long applicationId, long newCvId) throws CvNotFoundException, CVNotApprovedException, InternshipApplicationNotFoundException, ApplicationAlreadyReadException, CVNotVisibleException, DeadlineAlreadyPassedException {
        InternshipApplication application = validateInternshipApplicationForUpdate(email, applicationId);

        CV newCv = validateCVForApplication(email, newCvId);

        application.changeCv(newCv);

        applicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public List<InternshipApplicationResponseDto> getInternshipApplications(String email) throws UserNotFoundException {
        Student student = findByEmail(email);
        return applicationRepository.findByStudent(student).stream()
                .filter(application -> isVisibleToStudents(application.getInternship()))
                .map(InternshipApplicationResponseDto::of)
                .toList();
    }

    private boolean isVisibleToStudents(Internship internship) {
        return !internship.isDeleted() && internship.getStatus() == ReviewStatus.APPROVED;
    }

    private CV validateCVForApplication(String email, long cvId) throws CvNotFoundException, CVNotApprovedException, CVNotVisibleException {
        CV cv = findStudentCv(email, cvId);

        if (!cv.getStatus().equals(ReviewStatus.APPROVED)) {
            throw new CVNotApprovedException();
        }

        if (!cv.getVisibility().equals(CvVisibility.VISIBLE)) {
            throw new CVNotVisibleException();
        }

        return cv;
    }

    private Internship validateInternshipForApplication(long internshipId, Discipline discipline) throws InternshipNotFoundException, DeadlineAlreadyPassedException {
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new InternshipNotFoundException(internshipId));

        if (!isVisibleToStudents(internship)) {
            throw new InternshipNotFoundException(internshipId);
        }

        Discipline internshipDiscipline = internship.getPostedBy().getDiscipline();
        if (!internshipDiscipline.equals(discipline)) {
            throw new InternshipNotFoundException(internshipId);
        }

        verifyIfApplicationDeadlinePassed(internship);

        return internship;
    }

    private InternshipApplication validateInternshipApplicationForUpdate(String email, long applicationId)
            throws InternshipApplicationNotFoundException, ApplicationAlreadyReadException, DeadlineAlreadyPassedException {
        InternshipApplication application = applicationRepository
                .findByIdAndStudent_Credentials_Email(applicationId, email)
                .orElseThrow(() -> new InternshipApplicationNotFoundException(applicationId));

        Internship internship = application.getInternship();
        if (!isVisibleToStudents(internship)) {
            throw new InternshipApplicationNotFoundException(applicationId);
        }
        if (application.getInternshipApplicationStatus() == InternshipApplicationStatus.READ) {
            throw new ApplicationAlreadyReadException();
        }

        verifyIfApplicationDeadlinePassed(internship);

        return application;
    }

    private void verifyIfStudentIdIsAlreadyUsed(String studentId) throws UserAlreadyExistsException {
        Optional<Student> student = studentRepository.findByStudentId(studentId);

        if (student.isPresent()) {
            throw new UserAlreadyExistsException(STUDENT_ID_FIELD);
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

    private void verifyIfApplicationDeadlinePassed(Internship internship) throws DeadlineAlreadyPassedException {
        if (hasApplicationDeadlinePassed(internship)) {
            throw new DeadlineAlreadyPassedException();
        }
    }

    private boolean hasApplicationDeadlinePassed(Internship internship) {
        return LocalDate.now().isAfter(internship.getApplicationDeadline());
    }

    private void notifyManagersOfSubmittedCv(CV cv) {
        managerRepository.findAll()
                .forEach(manager -> notificationService.notifyIfAbsent(NotificationType.CV_SUBMITTED_FOR_REVIEW, cv.getId(), manager));
    }

    private void notifyEmployerOfNewApplication(InternshipApplication internshipApplication) {
        Internship internship = internshipApplication.getInternship();

        notificationService.notifyIfAbsent(NotificationType.NEW_INTERNSHIP_APPLICATION, internshipApplication.getId(), internship.getPostedBy());
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
        Set<Long> viewedIds = studentRepository.findViewedInternshipIds(student);
        List<Internship> internships = findInternships(student);
        List<InternshipResponseDto> internshipResponses = new ArrayList<>();
        for (Internship internship : internships) {
            if (!internship.getStatus().equals(ReviewStatus.APPROVED)) {
                continue;
            }
            if (hasApplicationDeadlinePassed(internship)) {
                continue;
            }
            internshipResponses.add(InternshipResponseDto.of(internship, viewedIds.contains(internship.getId())));
        }
        return internshipResponses;
    }

    @Transactional
    public void markInternshipsAsViewed(String email, List<Long> internshipIds) throws UserNotFoundException {
        Student student = findByEmail(email);

        internshipRepository
                .findByIdInAndDeletedFalseAndStatusAndPostedBy_Discipline(internshipIds, ReviewStatus.APPROVED, student.getDiscipline())
                .forEach(student::markViewed);
    }
}