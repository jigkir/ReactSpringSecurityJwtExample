package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.InternshipStatus;
import com.lacouf.rsbjwt.model.notification.Notification;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.service.dto.request.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.request.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.*;
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
    private final InternshipRepository internshipRepository;
    private final NotificationRepository notificationRepository;
    private final ManagerRepository managerRepository;

    private final int MAX_FILE_SIZE = 2 * 1024 * 1024; //2MB

    private final Tika tika = new Tika();

    private static final String CV_SUBMITTED_TITLE = "New CV Pending Review";
    private static final String CV_SUBMITTED_MESSAGE = "A new CV has been submitted for review.";

    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, CVRepository cvRepository, InternshipRepository internshipRepository, NotificationRepository notificationRepository, ManagerRepository managerRepository) {
        this.cvRepository = cvRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
        this.internshipRepository = internshipRepository;
        this.notificationRepository = notificationRepository;
        this.managerRepository = managerRepository;
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

    public Student findById(long id) throws UserNotFoundException {
        return studentRepository.findById(id)
                .orElseThrow(UserNotFoundException::new);
    }

    public void uploadCV(CvUploadDto upload, long studentId) throws UserNotFoundException, InvalidFileTypeException, InvalidFileSizeException, NoSuchAlgorithmException, CorruptedFileException {
        Student student = findById(studentId);

        saveCV(upload, student);
    }

    public void saveCV(CvUploadDto upload, Student student) throws InvalidFileTypeException, InvalidFileSizeException, NoSuchAlgorithmException, CorruptedFileException {
        verifyFileSize(upload.content());

        if (!"application/pdf".equals(tika.detect(upload.content()))) {
            throw new InvalidFileTypeException("Invalid file type. Only PDF files are allowed.");
        }

        CV cv = new CV(upload.content(), CvVisibility.VISIBLE, CVSharingScope.PRIVATE, CvPriority.SECONDARY, upload.fileName(), LocalDateTime.now());

        cv.setStudent(student);

        cv.setFileHash(calculateFileHash(cv.getContent()));

        if (!isCVReadable(cv)) {
            throw new CorruptedFileException("The PDF file is corrupted or unreadable.");
        }

        cvRepository.save(cv);
    }

    public String calculateFileHash(byte[] content) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(content);
        return HexFormat.of().formatHex(hashBytes);
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

    public long getCVCountByStudentId(long id) throws UserNotFoundException {
        Student student = findById(id);
        if (student == null) {
            return 0;
        }
        return cvRepository.countByStudentAndVisibility(student, CvVisibility.VISIBLE);
    }

    public List<StudentCvResponseDto> getCVs(long id) throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {
        Student student = findById(id);
        if (student == null) {
            throw new UserNotFoundException();
        }
        List<CV> cvs = cvRepository.findByStudent(student);
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
    public void setCvAsInvisible(long id, long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        cv.setVisibility(CvVisibility.HIDDEN);
        cvRepository.save(cv);

        closeCvSubmittedNotifications(cvId);
    }

    public CV findCvById(long cvId) throws CvNotFoundException {
        CV cv = cvRepository.findById(cvId).orElse(null);
        if (cv == null) {
            throw new CvNotFoundException("CV with ID " + cvId + " not found.");
        }
        return cv;
    }

    @Transactional
    public void setCvAsPublic(long id, long cvId) throws UserNotFoundException, CVAlreadyPublicException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);

        if (cv.getSharingScope() == CVSharingScope.PUBLIC) {
            throw new CVAlreadyPublicException("The CV with ID " + cvId + " is already public.");
        }

        cv.setSharingScope(CVSharingScope.PUBLIC);
        cvRepository.save(cv);

        if (cv.getStatus() == CvStatus.PENDING) notifyManagersOfSubmittedCv(cv);
    }

    @Transactional
    public void setCVAsSecondary(long id, long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        cv.setPriority(CvPriority.SECONDARY);
        cvRepository.save(cv);
    }

    @Transactional
    public void setCVAsMain(long id, long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        CV currentMainCv = cvRepository.findByStudentAndPriority(student, CvPriority.MAIN);
        if (currentMainCv != null && !currentMainCv.getId().equals(cvId)) {
            currentMainCv.setPriority(CvPriority.SECONDARY);
            cvRepository.save(currentMainCv);
        }
        cv.setPriority(CvPriority.MAIN);
        cvRepository.save(cv);
    }

    @Transactional
    public void setCvAsPrivate(long id, long cvId) throws UserNotFoundException, CVAlreadyPrivateException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        if (cv.getSharingScope() == CVSharingScope.PRIVATE) {
            throw new CVAlreadyPrivateException("The CV with ID " + cvId + " is already private.");
        }
        cv.setSharingScope(CVSharingScope.PRIVATE);
        cvRepository.save(cv);

        closeCvSubmittedNotifications(cvId);
    }

    public CvFileResponseDto getCVByStudentId(long studentId, long cvId) throws UserNotFoundException, CvNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        Student student = findById(studentId);
        CV cv = validateAndGetStudentCv(student, cvId);
        if (!isCVReadable(cv)) {
            throw new CorruptedFileException("The CV with ID " + cv.getId() + " is corrupted or unreadable.");
        }
        return CvFileResponseDto.of(cv);
    }

    public String getCVStatus(long studentId, long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = findById(studentId);
        CV cv = validateAndGetStudentCv(student, cvId);
        return cv.getStatus().name();
    }

    public List<InternshipResponseDto> getStudentInternships(long studentId) throws UserNotFoundException {
        Student student = findById(studentId);
        List<CV> studentCvs = cvRepository.findByStudent(student);
        boolean hasApprovedCv = studentCvs.stream().anyMatch(cv -> cv.getVisibility() == CvVisibility.VISIBLE && cv.getStatus() == CvStatus.APPROVED);

        if (!hasApprovedCv) {
            return Collections.emptyList();
        }

        Discipline discipline = getDisciplineByStudent(student);
        List<Internship> internships = filterInternshipsByDisciplineAndStatus(internshipRepository.findAll(), discipline);


        return internships.stream().map(InternshipResponseDto::of).toList();
    }

    public List<NotificationDto> getStudentNotifications(String email) {
        return notificationRepository.findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc(email, NotificationStatus.UNREAD).stream()
                .map(NotificationDto::of)
                .toList();
    }

    @Transactional
    public void markNotificationAsRead(long notificationId) throws UserNotFoundException {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(UserNotFoundException::new);

        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markInternshipsNotificationAsRead(String email) {
        notificationRepository.markAllAsReadByEmailAndNotificationType(email, NotificationType.NEW_INTERNSHIP_OFFER);
    }

    public int getUnreadNotificationCountForInternships(String email) {
        List<Notification> notifications = notificationRepository.findByUser_Credentials_EmailAndStatusOrderByCreatedAtDesc(email, NotificationStatus.UNREAD);
        return (int) notifications.stream()
                .filter(notification -> notification.getNotificationType() == NotificationType.NEW_INTERNSHIP_OFFER)
                .count();
    }

    @Transactional
    public void createNewInternshipNotificationsForStudents(Internship internship) {
        List<Student> students = studentRepository.findByDiscipline(getEmployerDisciplineByInternship(internship));

        for (Student student : students) {
            List<CV> studentCvs = cvRepository.findByStudent(student);
            boolean hasApprovedCv = studentCvs.stream().anyMatch(cv -> cv.getVisibility() == CvVisibility.VISIBLE && cv.getStatus() == CvStatus.APPROVED);
            boolean notificationExists = notificationRepository.existsByNotificationTypeAndTargetIdAndUser(NotificationType.NEW_INTERNSHIP_OFFER, internship.getId(), student);
            if (!notificationExists && hasApprovedCv) {
                createNewInternshipNotificationForStudent(
                        internship.getId(),
                        student
                );
            }
        }
    }

    private Discipline getDisciplineByStudent(Student student) {
        return student.getDiscipline();
    }

    private Discipline getEmployerDisciplineByInternship(Internship internship) {
        Employer employer = internship.getPostedBy();
        return employer.getDiscipline();
    }

    private List<Internship> filterInternshipsByDisciplineAndStatus(List<Internship> internships, Discipline discipline) {
        return internships.stream()
                .filter(internship -> getEmployerDisciplineByInternship(internship).equals(discipline))
                .filter(internship -> internship.getStatus() == InternshipStatus.APPROVED)
                .toList();
    }

    private void createNewInternshipNotificationForStudent(long internshipId, Student student) {
        Notification notification = new Notification(
                "New Internship Offer",
                "A new internship offer has been posted that matches your discipline.",
                NotificationStatus.UNREAD,
                NotificationType.NEW_INTERNSHIP_OFFER,
                TargetType.INTERNSHIP_OFFER,
                internshipId,
                student
        );
        notificationRepository.save(notification);
    }

    private CV validateAndGetStudentCv(Student student, long cvId) throws UserNotFoundException, CvNotFoundException {
        if (student == null) {
            throw new UserNotFoundException();
        }
        CV cv = findCvById(cvId);
        Student cvStudent = cv.getStudent();
        if (!Objects.equals(student.getId(), cvStudent.getId())) {
            throw new UserNotFoundException();
        }
        return cv;
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
        managerRepository.findAll().stream()
                .filter(manager -> !notificationRepository.existsByNotificationTypeAndTargetIdAndUser(NotificationType.CV_SUBMITTED_FOR_REVIEW, cv.getId(), manager))
                .forEach(manager -> notificationRepository.save(new Notification(CV_SUBMITTED_TITLE, CV_SUBMITTED_MESSAGE, NotificationStatus.UNREAD, NotificationType.CV_SUBMITTED_FOR_REVIEW, TargetType.CV, cv.getId(), manager)));
    }

    private void closeCvSubmittedNotifications(long cvId) {
        notificationRepository.markAllAsReadByNotificationTypeAndTargetId(NotificationType.CV_SUBMITTED_FOR_REVIEW, cvId);
    }
}