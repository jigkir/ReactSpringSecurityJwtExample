package com.lacouf.rsbjwt.presentation.users;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.users.StudentService;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.*;
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
    public ResponseEntity<String> uploadCV(@RequestParam("file") MultipartFile file, Authentication authentication) throws IOException, UserNotFoundException, InvalidFileTypeException, NoSuchAlgorithmException, CorruptedFileException, InvalidFileSizeException {
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

    @PutMapping("/cvs/{cvId}/public")
    public ResponseEntity<String> makeCVPublic(Authentication authentication, @PathVariable long cvId) throws CVAlreadyPublicException, CvNotFoundException {
        studentService.setCvAsPublic(authentication.getName(), cvId);
        return new ResponseEntity<>("CV made public successfully", HttpStatus.OK);
    }

    @PutMapping("/cvs/{cvId}/private")
    public ResponseEntity<String> makeCVPrivate(Authentication authentication, @PathVariable long cvId) throws CVAlreadyPrivateException, CvNotFoundException {
        studentService.setCvAsPrivate(authentication.getName(), cvId);
        return new ResponseEntity<>("CV made private successfully", HttpStatus.OK);
    }

    @PutMapping("/cvs/{cvId}/secondary")
    public ResponseEntity<String> makeCVSecondary(Authentication authentication, @PathVariable long cvId) throws CvNotFoundException {
        studentService.setCVAsSecondary(authentication.getName(), cvId);
        return new ResponseEntity<>("CV made secondary successfully", HttpStatus.OK);
    }

    @PutMapping("/cvs/{cvId}/main")
    public ResponseEntity<String> makeCVMain(Authentication authentication, @PathVariable long cvId) throws CvNotFoundException {
        studentService.setCVAsMain(authentication.getName(), cvId);
        return new ResponseEntity<>("CV made main successfully", HttpStatus.OK);
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
}