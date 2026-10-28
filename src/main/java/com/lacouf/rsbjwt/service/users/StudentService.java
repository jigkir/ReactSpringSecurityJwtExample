package com.lacouf.rsbjwt.service.users;

import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyExistsException;
import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyReadException;
import com.lacouf.rsbjwt.exception.application.DeadlineAlreadyPassedException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.document.*;
import com.lacouf.rsbjwt.exception.document.student.cv.CVNotApprovedException;
import com.lacouf.rsbjwt.exception.document.student.cv.CVNotVisibleException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.document.student.academictranscript.AcademicTranscript;
import com.lacouf.rsbjwt.model.document.student.coverletter.CoverLetter;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.repository.document.student.academictranscript.AcademicTranscriptRepository;
import com.lacouf.rsbjwt.repository.document.student.coverletter.CoverLetterRepository;
import com.lacouf.rsbjwt.repository.document.student.cv.CVRepository;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.repository.interview.InterviewRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.repository.users.StudentRepository;
import com.lacouf.rsbjwt.service.document.DocumentService;
import com.lacouf.rsbjwt.service.dto.request.document.DocumentUploadDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.application.InternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.StudentInternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.interview.InterviewStudentResponseDTO;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class StudentService {
    private static final String STUDENT_ID_FIELD = "studentId";

    private final StudentRepository studentRepository;
    private final CVRepository cvRepository;
    private final CoverLetterRepository coverLetterRepository;
    private final AcademicTranscriptRepository academicTranscriptRepository;
    private final ManagerRepository managerRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final InterviewRepository InterviewRepository;

    private final UserAppService userAppService;
    private final NotificationService notificationService;
    private final DocumentService documentService;

    public StudentService(StudentRepository studentRepository, UserAppService userAppService, CVRepository cvRepository, CoverLetterRepository coverLetterRepository, AcademicTranscriptRepository academicTranscriptRepository, ManagerRepository managerRepository, NotificationService notificationService, InternshipRepository internshipRepository, InternshipApplicationRepository applicationRepository, DocumentService documentService, InterviewRepository InterviewRepository) {
        this.userAppService = userAppService;
        this.cvRepository = cvRepository;
        this.studentRepository = studentRepository;
        this.coverLetterRepository = coverLetterRepository;
        this.academicTranscriptRepository = academicTranscriptRepository;
        this.managerRepository = managerRepository;
        this.notificationService = notificationService;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.documentService = documentService;
        this.InterviewRepository = InterviewRepository;
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
    public void uploadCV(DocumentUploadDto upload, String email) throws UserNotFoundException, InvalidFileTypeException, InvalidFileSizeException, NoSuchAlgorithmException, CorruptedFileException, EmptyFileException {
        Student student = findByEmail(email);

        saveCV(upload, student);
    }

    @Transactional
    public void saveCV(DocumentUploadDto upload, Student student) throws InvalidFileTypeException, InvalidFileSizeException, NoSuchAlgorithmException, CorruptedFileException, EmptyFileException {
        CV cv = new CV(upload.content(), upload.fileName(), LocalDateTime.now());

        cv.setStudent(student);

        CV savedCv = documentService.save(cv, cvRepository);

        notifyManagersOfSubmittedCv(savedCv);
    }

    public long getCVCount(String email) throws UserNotFoundException {
        return cvRepository.countByUserAndVisibility(findByEmail(email), DocumentVisibility.VISIBLE);
    }

    public List<StudentCvResponseDto> getCVs(String email) throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {
        List<CV> cvs = cvRepository.findByUser(findByEmail(email));
        List<StudentCvResponseDto> studentCvResponseDtos = new ArrayList<>();

        for (CV cv : cvs) {
            if (!documentService.isReadable(cv)) {
                throw new CorruptedFileException();
            }

            if (!cv.getVisibility().equals(DocumentVisibility.VISIBLE)) {
                continue;
            }

            studentCvResponseDtos.add(StudentCvResponseDto.of(cv));
        }
        return studentCvResponseDtos;
    }

    @Transactional
    public void setCvAsInvisible(String email, long cvId) throws DocumentNotFoundException {
        CV cv = findStudentCv(email, cvId);
        cv.hide();
        cvRepository.save(cv);

        closeCvNotifications(cvId);
    }

    public DocumentFileResponseDto getCV(String email, long cvId) throws DocumentNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        return documentService.getFile(findStudentCv(email, cvId));
    }

    public String getCVStatus(String email, long cvId) throws DocumentNotFoundException {
        CV cv = findStudentCv(email, cvId);
        return cv.getStatus().name();
    }

    public List<StudentCvResponseDto> getApprovedAndVisibleCVs(String email) {
        List<CV> cvs = cvRepository.findByUser_Credentials_EmailAndStatusAndVisibility(email, ReviewStatus.APPROVED, DocumentVisibility.VISIBLE);
        List<StudentCvResponseDto> approvedCvResponseDtos = new ArrayList<>();
        for (CV cv : cvs) {
            approvedCvResponseDtos.add(StudentCvResponseDto.of(cv));
        }
        return approvedCvResponseDtos;
    }

    public void uploadCoverLetter(DocumentUploadDto upload, String email) throws UserNotFoundException, EmptyFileException, InvalidFileSizeException, InvalidFileTypeException, CorruptedFileException, NoSuchAlgorithmException {
        CoverLetter coverLetter = new CoverLetter(upload.content(), upload.fileName(), LocalDateTime.now());

        coverLetter.setStudent(findByEmail(email));

        documentService.save(coverLetter, coverLetterRepository);
    }

    public List<DocumentResponseDto> getCoverLetters(String email) throws CorruptedFileException, NoSuchAlgorithmException {
        return documentService.getVisibleDocuments(email, coverLetterRepository);
    }

    public DocumentFileResponseDto getCoverLetter(String email, long coverLetterId) throws CorruptedFileException, NoSuchAlgorithmException, DocumentNotFoundException {
        return documentService.getFile(findStudentCoverLetter(email, coverLetterId));
    }

    public void hideCoverLetter(String email, long coverLetterId) throws DocumentNotFoundException {
        CoverLetter coverLetter = findStudentCoverLetter(email, coverLetterId);
        coverLetter.hide();
        coverLetterRepository.save(coverLetter);
    }

    public void uploadAcademicTranscript(DocumentUploadDto upload, String email) throws UserNotFoundException, EmptyFileException, InvalidFileSizeException, InvalidFileTypeException, CorruptedFileException, NoSuchAlgorithmException {
        AcademicTranscript academicTranscript = new AcademicTranscript(upload.content(), upload.fileName(), LocalDateTime.now());

        academicTranscript.setStudent(findByEmail(email));

        documentService.save(academicTranscript, academicTranscriptRepository);
    }

    public List<DocumentResponseDto> getAcademicTranscripts(String email) throws CorruptedFileException, NoSuchAlgorithmException {
        return documentService.getVisibleDocuments(email, academicTranscriptRepository);
    }

    public DocumentFileResponseDto getAcademicTranscript(String email, long academicTranscriptId) throws CorruptedFileException, NoSuchAlgorithmException, DocumentNotFoundException {
        return documentService.getFile(findStudentAcademicTranscript(email, academicTranscriptId));
    }

    public void hideAcademicTranscript(String email, long academicTranscriptId) throws DocumentNotFoundException {
        AcademicTranscript academicTranscript = findStudentAcademicTranscript(email, academicTranscriptId);
        academicTranscript.hide();
        academicTranscriptRepository.save(academicTranscript);
    }

    @Transactional
    public void applyToInternship(String email, long cvId, long internshipId) throws UserNotFoundException, DocumentNotFoundException, InternshipNotFoundException, CVNotApprovedException, ApplicationAlreadyExistsException, DeadlineAlreadyPassedException, CVNotVisibleException {
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
    public void updateInternshipApplication(String email, long applicationId, long newCvId) throws DocumentNotFoundException, CVNotApprovedException, InternshipApplicationNotFoundException, ApplicationAlreadyReadException, CVNotVisibleException, DeadlineAlreadyPassedException {
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

    public List<StudentInternshipResponseDto> getInternships(String email) throws UserNotFoundException {
        Student student = findByEmail(email);

        Set<Long> viewedInternshipIds = studentRepository.findViewedInternshipIds(student);
        Set<Long> hiddenInternshipIds = studentRepository.findHiddenInternshipIds(student);
        Set<Long> favoriteInternshipIds = studentRepository.findFavoriteInternshipIds(student);
        Set<Long> appliedInternshipIds = applicationRepository.findInternshipIdsByStudent(student);

        List<Internship> internships = findInternships(student);
        List<StudentInternshipResponseDto> internshipResponses = new ArrayList<>();

        for (Internship internship : internships) {
            ReviewStatus reviewStatus = internship.getStatus();

            if (!reviewStatus.equals(ReviewStatus.APPROVED)) {
                continue;
            }

            long internshipId = internship.getId();

            if (hasApplicationDeadlinePassed(internship) && !appliedInternshipIds.contains(internshipId)) {
                continue;
            }

            internshipResponses.add(StudentInternshipResponseDto.of(internship, viewedInternshipIds.contains(internshipId), hiddenInternshipIds.contains(internshipId), favoriteInternshipIds.contains(internshipId)));
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

    @Transactional
    public void hideInternship(String email, long internshipId) throws UserNotFoundException, InternshipNotFoundException {
        Student student = findByEmail(email);
        Internship internship = findInternshipVisibleTo(student, internshipId);

        student.removeFromFavorites(internship);
        student.hide(internship);
    }

    @Transactional
    public void unhideInternship(String email, long internshipId) throws UserNotFoundException, InternshipNotFoundException {
        Student student = findByEmail(email);

        student.unhide(findInternshipVisibleTo(student, internshipId));
    }

    @Transactional
    public void addInternshipToFavorites(String email, long internshipId) throws UserNotFoundException, InternshipNotFoundException {
        Student student = findByEmail(email);
        Internship internship = findInternshipVisibleTo(student, internshipId);

        student.unhide(internship);
        student.addToFavorites(internship);
    }

    @Transactional
    public void removeInternshipFromFavorites(String email, long internshipId) throws UserNotFoundException, InternshipNotFoundException {
        Student student = findByEmail(email);

        student.removeFromFavorites(findInternshipVisibleTo(student, internshipId));
    }

    @Transactional(readOnly = true)
    public List<InterviewStudentResponseDTO> getInterviews(String email) throws UserNotFoundException {
        Student student = findByEmail(email);
        return InterviewRepository.findByInternshipApplication_Student(student).stream()
                .filter(interview -> isVisibleToStudents(interview.getInternshipApplication().getInternship()))
                .map(InterviewStudentResponseDTO::of)
                .toList();
    }

    private boolean isVisibleToStudents(Internship internship) {
        return !internship.isDeleted() && internship.getStatus() == ReviewStatus.APPROVED;
    }

    private CV validateCVForApplication(String email, long cvId) throws DocumentNotFoundException, CVNotApprovedException, CVNotVisibleException {
        CV cv = findStudentCv(email, cvId);

        if (!cv.getStatus().equals(ReviewStatus.APPROVED)) {
            throw new CVNotApprovedException();
        }

        if (!cv.getVisibility().equals(DocumentVisibility.VISIBLE)) {
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

    private Student findByEmail(String email) throws UserNotFoundException {
        return studentRepository.findByCredentialsEmail(email).orElseThrow(UserNotFoundException::new);
    }

    private CV findStudentCv(String email, long cvId) throws DocumentNotFoundException {
        return cvRepository.findByIdAndUser_Credentials_Email(cvId, email).orElseThrow(() -> new DocumentNotFoundException(cvId));
    }

    private CoverLetter findStudentCoverLetter(String email, long coverLetterId) throws DocumentNotFoundException {
        return coverLetterRepository.findByIdAndUser_Credentials_Email(coverLetterId, email).orElseThrow(() -> new DocumentNotFoundException(coverLetterId));
    }

    private AcademicTranscript findStudentAcademicTranscript(String email, long academicTranscriptId) throws DocumentNotFoundException {
        return academicTranscriptRepository.findByIdAndUser_Credentials_Email(academicTranscriptId, email).orElseThrow(() -> new DocumentNotFoundException(academicTranscriptId));
    }

    private Internship findInternshipVisibleTo(Student student, long internshipId) throws InternshipNotFoundException {
        return internshipRepository
                .findByIdAndDeletedFalseAndStatusAndPostedBy_Discipline(internshipId, ReviewStatus.APPROVED, student.getDiscipline())
                .orElseThrow(() -> new InternshipNotFoundException(internshipId));
    }

    private List<Internship> findInternships(Student student) {
        return internshipRepository.findByPostedBy_DisciplineAndDeletedIsFalse(student.getDiscipline());
    }
}