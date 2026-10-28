package com.lacouf.rsbjwt.presentation.users;

import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyExistsException;
import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyReadException;
import com.lacouf.rsbjwt.exception.application.DeadlineAlreadyPassedException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.document.CorruptedFileException;
import com.lacouf.rsbjwt.exception.document.EmptyFileException;
import com.lacouf.rsbjwt.exception.document.InvalidFileSizeException;
import com.lacouf.rsbjwt.exception.document.InvalidFileTypeException;
import com.lacouf.rsbjwt.exception.document.student.cv.CVNotApprovedException;
import com.lacouf.rsbjwt.exception.document.student.cv.CVNotVisibleException;
import com.lacouf.rsbjwt.exception.document.DocumentNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.document.DocumentUploadDto;
import com.lacouf.rsbjwt.service.dto.request.internship.ViewedInternshipsDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.application.InternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.StudentDocumentResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.StudentInternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.users.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.List;

@RestController
@RequestMapping("/api/student")
public class StudentController {
    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> save(@Valid @RequestBody StudentSignUpDto studentSignUpDto) throws UserAlreadyExistsException {
        UserResponseDto signedUpStudent = studentService.save(studentSignUpDto);
        return new ResponseEntity<>(signedUpStudent, HttpStatus.CREATED);
    }

    @PostMapping("/cvs")
    public ResponseEntity<String> uploadCV(@RequestParam("file") MultipartFile file, Authentication authentication) throws IOException, UserNotFoundException, InvalidFileTypeException, NoSuchAlgorithmException, CorruptedFileException, InvalidFileSizeException, EmptyFileException {
        DocumentUploadDto upload = new DocumentUploadDto(file.getBytes(), file.getOriginalFilename());

        studentService.uploadCV(upload, authentication.getName());

        return new ResponseEntity<>("CV uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/cvs")
    public ResponseEntity<List<StudentCvResponseDto>> getStudentCVs(Authentication authentication)
            throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {

        List<StudentCvResponseDto> studentCvResponseDtos = studentService.getCVs(authentication.getName());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(studentCvResponseDtos);
    }

    @GetMapping("/cvs/count")
    public ResponseEntity<Long> getCVCount(Authentication authentication) throws UserNotFoundException {
        long cvCount = studentService.getCVCount(authentication.getName());
        return new ResponseEntity<>(cvCount, HttpStatus.OK);
    }

    @PutMapping("/cvs/{cvId}/hide")
    public ResponseEntity<String> hideCV(Authentication authentication, @PathVariable long cvId) throws DocumentNotFoundException {
        studentService.setCvAsInvisible(authentication.getName(), cvId);
        return new ResponseEntity<>("CV hidden successfully", HttpStatus.OK);
    }

    @GetMapping("/cvs/{cvId}")
    public ResponseEntity<DocumentFileResponseDto> getCV(Authentication authentication, @PathVariable long cvId) throws DocumentNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        return ResponseEntity.ok(studentService.getCV(authentication.getName(), cvId));
    }

    @GetMapping("/cvs/{cvId}/status")
    public ResponseEntity<String> getCVStatus(Authentication authentication, @PathVariable long cvId) throws DocumentNotFoundException {
        String status = studentService.getCVStatus(authentication.getName(), cvId);
        return new ResponseEntity<>(status, HttpStatus.OK);
    }

    @PostMapping("/cover-letters")
    public ResponseEntity<String> uploadCoverLetter(@RequestParam("file") MultipartFile file, Authentication authentication) throws IOException, UserNotFoundException, EmptyFileException, InvalidFileSizeException, InvalidFileTypeException, CorruptedFileException, NoSuchAlgorithmException {
        DocumentUploadDto documentUploadDto = new DocumentUploadDto(file.getBytes(), file.getOriginalFilename());

        studentService.uploadCoverLetter(documentUploadDto, authentication.getName());

        return new ResponseEntity<>("Cover letter uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/cover-letters")
    public ResponseEntity<List<StudentDocumentResponseDto>> getCoverLetters(Authentication authentication) throws CorruptedFileException, NoSuchAlgorithmException {
        return ResponseEntity.ok(studentService.getCoverLetters(authentication.getName()));
    }

    @GetMapping("/cover-letters/{coverLetterId}")
    public ResponseEntity<DocumentFileResponseDto> getCoverLetter(Authentication authentication, @PathVariable long coverLetterId) throws CorruptedFileException, NoSuchAlgorithmException, DocumentNotFoundException {
        return ResponseEntity.ok(studentService.getCoverLetter(authentication.getName(), coverLetterId));
    }

    @PutMapping("/cover-letters/{coverLetterId}/hide")
    public ResponseEntity<String> hideCoverLetter(Authentication authentication, @PathVariable long coverLetterId) throws DocumentNotFoundException {
        studentService.hideCoverLetter(authentication.getName(), coverLetterId);

        return new ResponseEntity<>("Cover letter hidden successfully", HttpStatus.OK);
    }

    @PostMapping("/academic-transcripts")
    public ResponseEntity<String> uploadAcademicTranscript(@RequestParam("file") MultipartFile file, Authentication authentication) throws IOException, UserNotFoundException, EmptyFileException, InvalidFileSizeException, InvalidFileTypeException, CorruptedFileException, NoSuchAlgorithmException {
        DocumentUploadDto upload = new DocumentUploadDto(file.getBytes(), file.getOriginalFilename());

        studentService.uploadAcademicTranscript(upload, authentication.getName());

        return new ResponseEntity<>("Academic transcript uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/academic-transcripts")
    public ResponseEntity<List<StudentDocumentResponseDto>> getAcademicTranscripts(Authentication authentication) throws CorruptedFileException, NoSuchAlgorithmException {
        return ResponseEntity.ok(studentService.getAcademicTranscripts(authentication.getName()));
    }

    @GetMapping("/academic-transcripts/{academicTranscriptId}")
    public ResponseEntity<DocumentFileResponseDto> getAcademicTranscript(Authentication authentication, @PathVariable long academicTranscriptId) throws CorruptedFileException, NoSuchAlgorithmException, DocumentNotFoundException {
        return ResponseEntity.ok(studentService.getAcademicTranscript(authentication.getName(), academicTranscriptId));
    }

    @PutMapping("/academic-transcripts/{academicTranscriptId}/hide")
    public ResponseEntity<String> hideAcademicTranscript(Authentication authentication, @PathVariable long academicTranscriptId) throws DocumentNotFoundException {
        studentService.hideAcademicTranscript(authentication.getName(), academicTranscriptId);

        return new ResponseEntity<>("Academic transcript hidden successfully", HttpStatus.OK);
    }

    @GetMapping("/internship")
    public ResponseEntity<List<StudentInternshipResponseDto>> getInternships(Authentication authentication) throws UserNotFoundException {
        List<StudentInternshipResponseDto> internshipResponseDtos = studentService.getInternships(authentication.getName());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(internshipResponseDtos);
    }

    @GetMapping("/cvs/approved")
    public ResponseEntity<List<StudentCvResponseDto>> getApprovedCVs(Authentication authentication) {
        List<StudentCvResponseDto> approvedCVs = studentService.getApprovedAndVisibleCVs(authentication.getName());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(approvedCVs);
    }

    @PostMapping("/internship/{internshipId}/apply/{cvId}")
    public ResponseEntity<String> applyForInternship(Authentication authentication, @PathVariable long internshipId, @PathVariable long cvId) throws UserNotFoundException, DocumentNotFoundException, InternshipNotFoundException, ApplicationAlreadyExistsException, CVNotApprovedException, DeadlineAlreadyPassedException, CVNotVisibleException {
        studentService.applyToInternship(authentication.getName(), cvId, internshipId);
        return ResponseEntity.ok("Application submitted successfully");
    }

    @GetMapping("/applications")
    public ResponseEntity<List<InternshipApplicationResponseDto>> getAppliedInternships(Authentication authentication) throws UserNotFoundException {
        List<InternshipApplicationResponseDto> appliedInternships = studentService.getInternshipApplications(authentication.getName());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(appliedInternships);
    }

    @PutMapping("/applications/{applicationId}/{cvId}")
    public ResponseEntity<String> updateApplicationCV(Authentication authentication, @PathVariable long applicationId, @PathVariable long cvId) throws DocumentNotFoundException, CVNotApprovedException, InternshipApplicationNotFoundException, ApplicationAlreadyReadException, CVNotVisibleException, DeadlineAlreadyPassedException {
        studentService.updateInternshipApplication(authentication.getName(), applicationId, cvId);
        return ResponseEntity.ok("Application CV updated successfully");
    }

    @PutMapping("/internship/viewed")
    public ResponseEntity<Void> markInternshipsAsViewed(@Valid @RequestBody ViewedInternshipsDto viewedInternshipsDto, Authentication authentication) throws UserNotFoundException {
        studentService.markInternshipsAsViewed(authentication.getName(), viewedInternshipsDto.internshipIds());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/internship/{internshipId}/hidden")
    public ResponseEntity<Void> hideInternship(Authentication authentication, @PathVariable long internshipId) throws UserNotFoundException, InternshipNotFoundException {
        studentService.hideInternship(authentication.getName(), internshipId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/internship/{internshipId}/hidden")
    public ResponseEntity<Void> unhideInternship(Authentication authentication, @PathVariable long internshipId) throws UserNotFoundException, InternshipNotFoundException {
        studentService.unhideInternship(authentication.getName(), internshipId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/internship/{internshipId}/favorite")
    public ResponseEntity<Void> addInternshipToFavorites(Authentication authentication, @PathVariable long internshipId) throws UserNotFoundException, InternshipNotFoundException {
        studentService.addInternshipToFavorites(authentication.getName(), internshipId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/internship/{internshipId}/favorite")
    public ResponseEntity<Void> removeInternshipFromFavorites(Authentication authentication, @PathVariable long internshipId) throws UserNotFoundException, InternshipNotFoundException {
        studentService.removeInternshipFromFavorites(authentication.getName(), internshipId);
        return ResponseEntity.noContent().build();
    }
}