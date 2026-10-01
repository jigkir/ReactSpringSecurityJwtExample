package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.*;
import com.lacouf.rsbjwt.model.internship.Internship;
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

    private final int MAX_FILE_SIZE = 2 * 1024 * 1024; //2MB

    private final Tika tika = new Tika();

    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, CVRepository cvRepository, InternshipRepository internshipRepository, NotificationRepository notificationRepository) {
        this.cvRepository = cvRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
        this.internshipRepository = internshipRepository;
        this.notificationRepository = notificationRepository;
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

        // IMPORTANT: do NOT call student.addCv(cv) here.
        // spring.jpa.open-in-view=false => the Student is detached once findById returns, so touching
        // its lazy `cvs` collection throws LazyInitializationException (-> HTTP 500).
        // CV owns the relationship (Student.cvs is mappedBy = "student"), so setting the owning side is enough.
        cv.setStudent(student);

        // OLD
        // student.addCv(cv); // This is now handled by the CV entity

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
        return cvRepository.countByStudent(student);
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

    public void setCvAsInvisible(long id, long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        cv.setVisibility(CvVisibility.HIDDEN);
        cvRepository.save(cv);
    }

    public CV findCvById(long cvId) throws CvNotFoundException {
        CV cv = cvRepository.findById(cvId).orElse(null);
        if (cv == null) {
            throw new CvNotFoundException("CV with ID " + cvId + " not found.");
        }
        return cv;
    }

    public void setCvAsPublic(long id, long cvId) throws UserNotFoundException, CVAlreadyPublicException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        if (cv.getSharingScope() == CVSharingScope.PUBLIC) {
            throw new CVAlreadyPublicException("The CV with ID " + cvId + " is already public.");
        }
        cv.setSharingScope(CVSharingScope.PUBLIC);
        cvRepository.save(cv);
    }

    public void setCVAsSecondary(long id, long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        cv.setPriority(CvPriority.SECONDARY);
        cvRepository.save(cv);
    }

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

    public void setCvAsPrivate(long id, long cvId) throws UserNotFoundException, CVAlredyPrivateException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        if (cv.getSharingScope() == CVSharingScope.PRIVATE) {
            throw new CVAlredyPrivateException("The CV with ID " + cvId + " is already private.");
        }
        cv.setSharingScope(CVSharingScope.PRIVATE);
        cvRepository.save(cv);
    }

    public CvFileResponseDto getCVByStudentId(long studentId, long cvId) throws UserNotFoundException, CvNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        Student student = findById(studentId);
        CV cv = validateAndGetStudentCv(student, cvId);
        if (!isCVReadable(cv)) {
            throw new CorruptedFileException("The CV with ID " + cv.getId() + " is corrupted or unreadable.");
        }
        return CvFileResponseDto.of(cv);
    }

    public void setCVAsPending(long id, long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = findById(id);
        CV cv = validateAndGetStudentCv(student, cvId);
        cv.setStatus(CvStatus.PENDING);
        cv.setRejectionComment(null);
        cvRepository.save(cv);
    }

    public String getCVStatus(long studentId, long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = findById(studentId);
        CV cv = validateAndGetStudentCv(student, cvId);
        return cv.getStatus().name();
    }

    public List<InternshipResponseDto> getStudentInternships(long studentId) throws UserNotFoundException {
        Student student = findById(studentId);
        List<CV> studentCvs = cvRepository.findByStudent(student);
        boolean hasApprovedCv = studentCvs.stream().anyMatch(cv -> cv.getStatus() == CvStatus.APPROVED);

        if (!hasApprovedCv) {
            return Collections.emptyList();
        }

        Discipline discipline = getDisciplineByStudent(student);
        List<Internship> internships = filterInternshipsByDiscipline(internshipRepository.findAll(), discipline);

        return internships.stream().map(InternshipResponseDto::of).toList();
    }

    public void generateInternshipNotificationsForStudent(long studentId) throws UserNotFoundException {
        Student student = findById(studentId);
        List<CV> studentCvs = cvRepository.findByStudent(student);
        boolean hasApprovedCv = studentCvs.stream().anyMatch(cv -> cv.getStatus() == CvStatus.APPROVED);

        if (!hasApprovedCv) {
            return;
        }

        Discipline discipline = getDisciplineByStudent(student);
        List<Internship> internships = filterInternshipsByDiscipline(internshipRepository.findAll(), discipline);
        createNewInternshipNotifications(internships, student);
    }

    private Discipline getDisciplineByStudent(Student student) {
        return student.getDiscipline();
    }

    private Discipline getEmployerDisciplineByInternship(Internship internship) {
        Employer employer = internship.getPostedBy();
        return employer.getDiscipline();
    }

    private void createNewInternshipNotifications(List<Internship> internships, Student student) {
        List<Notification> existingNotifications = getNotificationsForStudent(student);

        for (Internship internship : internships) {
            Notification existingNotification = filterExistingNotificationsByInterishipId(existingNotifications, internship.getId());
            if (existingNotification == null) {
                createNewInternshipNotificationForStudent(
                        internship.getId(),
                        student
                );
            }
        }
    }

    public List<NotificationDto> getStudentNotifications(long studentId) throws UserNotFoundException {
        Student student = findById(studentId);
        generateInternshipNotificationsForStudent(studentId);
        List<Notification> notifications = getNotificationsForStudent(student);
        return notifications.stream().map(NotificationDto::of).toList();
    }

    public void markNotificationAsRead(long studentId, long notificationId) throws UserNotFoundException {
        Student student = findById(studentId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(UserNotFoundException::new);

        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
    }

    public int getUnreadNotificationCount(long studentId) throws UserNotFoundException {
        Student student = findById(studentId);
        List<Notification> notifications = getNotificationsForStudent(student);
        long unreadCount = notifications.stream()
                .filter(notification -> notification.getStatus() == NotificationStatus.UNREAD)
                .count();
        return (int) unreadCount;
    }

    private List<Internship> filterInternshipsByDiscipline(List<Internship> internships, Discipline discipline) {
        return internships.stream()
                .filter(internship -> getEmployerDisciplineByInternship(internship).equals(discipline))
                .toList();
    }

    private List<Notification> getNotificationsForStudent(Student student) {
        return notificationRepository.findByUserId(student.getId());
    }

    private Notification filterExistingNotificationsByInterishipId(List<Notification> notifications, long internshipId) {
        return notifications.stream()
                .filter(notification -> notification.getTargetType() == TargetType.INTERNSHIP_OFFER)
                .filter(notification -> notification.getTargetId() == internshipId)
                .findFirst()
                .orElse(null);
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
}