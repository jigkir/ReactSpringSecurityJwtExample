package com.lacouf.rsbjwt.presentation.users;

import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyExistsException;
import com.lacouf.rsbjwt.exception.application.ApplicationAlreadyReadException;
import com.lacouf.rsbjwt.exception.application.DeadlineAlreadyPassedException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.request.internship.ViewedInternshipsDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.application.InternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
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
        CvUploadDto upload = new CvUploadDto(file.getBytes(), file.getOriginalFilename());

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
    public ResponseEntity<String> hideCV(Authentication authentication, @PathVariable long cvId) throws CvNotFoundException {
        studentService.setCvAsInvisible(authentication.getName(), cvId);
        return new ResponseEntity<>("CV hidden successfully", HttpStatus.OK);
    }

    @GetMapping("/cvs/{cvId}")
    public ResponseEntity<CvFileResponseDto> getCV(Authentication authentication, @PathVariable long cvId) throws CvNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        return ResponseEntity.ok(studentService.getCV(authentication.getName(), cvId));
    }

    @GetMapping("/cvs/{cvId}/status")
    public ResponseEntity<String> getCVStatus(Authentication authentication, @PathVariable long cvId) throws CvNotFoundException {
        String status = studentService.getCVStatus(authentication.getName(), cvId);
        return new ResponseEntity<>(status, HttpStatus.OK);
    }

    @GetMapping("/internship")
    public ResponseEntity<List<InternshipResponseDto>> getInternships(Authentication authentication) throws UserNotFoundException {
        List<InternshipResponseDto> internshipResponseDtos = studentService.getInternships(authentication.getName());

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
    public ResponseEntity<String> applyForInternship(Authentication authentication, @PathVariable long internshipId, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException, InternshipNotFoundException, ApplicationAlreadyExistsException, CVNotApprovedException, DeadlineAlreadyPassedException, CVNotVisibleException {
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
    public ResponseEntity<String> updateApplicationCV(Authentication authentication, @PathVariable long applicationId, @PathVariable long cvId) throws CvNotFoundException, CVNotApprovedException, InternshipApplicationNotFoundException, ApplicationAlreadyReadException, CVNotVisibleException, DeadlineAlreadyPassedException {
        studentService.updateInternshipApplication(authentication.getName(), applicationId, cvId);
        return ResponseEntity.ok("Application CV updated successfully");
    }

    @PutMapping("/internship/viewed")
    public ResponseEntity<Void> markInternshipsAsViewed(@Valid @RequestBody ViewedInternshipsDto viewedInternshipsDto, Authentication authentication) throws UserNotFoundException {
        studentService.markInternshipsAsViewed(authentication.getName(), viewedInternshipsDto.internshipIds());
        return ResponseEntity.noContent().build();
    }
}