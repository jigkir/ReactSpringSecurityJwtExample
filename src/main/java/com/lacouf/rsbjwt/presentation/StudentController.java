package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.StudentService;
import com.lacouf.rsbjwt.service.dto.response.CVDto;
import com.lacouf.rsbjwt.service.dto.request.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.*;
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

    @PostMapping("/{id}/cvs")
    public ResponseEntity<String> uploadCV(
            @RequestParam("file") MultipartFile file,
            @PathVariable long id) throws CorruptedFileException, InvalidFileTypeException, IOException, NoSuchAlgorithmException, InvalidFileSizeException, UserNotFoundException, CvNotFoundException {

        studentService.uploadCV(file, id);
        return new ResponseEntity<>("CV uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/{id}/cvs")
    public ResponseEntity<List<CVDto>> getStudentCVs(@PathVariable long id)
            throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {

        Student student = studentService.findById(id);
        List<CVDto> cvDtos = studentService.getCVs(student);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(cvDtos);
    }

    @GetMapping("/{id}/cvs/count")
    public ResponseEntity<Long> getCVCount(@PathVariable long id) throws UserNotFoundException {
        Student student = studentService.findById(id);
        long cvCount = studentService.getCVCountByStudent(student);
        return new ResponseEntity<>(cvCount, HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/hide")
    public ResponseEntity<String> hideCV(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = studentService.findById(id);
        studentService.setCvAsInvisible(student, cvId);
        return new ResponseEntity<>("CV hidden successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/public")
    public ResponseEntity<String> makeCVPublic(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CVAlreadyPublicException, CvNotFoundException {
        Student student = studentService.findById(id);
        studentService.setCvAsPublic(student, cvId);
        return new ResponseEntity<>("CV made public successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/private")
    public ResponseEntity<String> makeCVPrivate(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CVAlredyPrivateException, CvNotFoundException {
        Student student = studentService.findById(id);
        studentService.setCvAsPrivate(student, cvId);
        return new ResponseEntity<>("CV made private successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/secondary")
    public ResponseEntity<String> makeCVSecondary(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = studentService.findById(id);
        studentService.setCVAsSecondary(student, cvId);
        return new ResponseEntity<>("CV made secondary successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/main")
    public ResponseEntity<String> makeCVMain(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = studentService.findById(id);
        studentService.setCVAsMain(student, cvId);
        return new ResponseEntity<>("CV made main successfully", HttpStatus.OK);
    }

    @GetMapping("/cvs/{id}")
    public ResponseEntity<UserResponseDto> getUserByCVId(@PathVariable long id) throws CvNotFoundException {
        UserResponseDto userResponseDto = studentService.getUserByCVId(id);
        return new ResponseEntity<>(userResponseDto, HttpStatus.OK);
    }

    @GetMapping("/{id}/cvs/{cvId}")
    public ResponseEntity<CVDto> getCVByStudentId(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        CVDto cvDto = studentService.getCVByStudentId(id, cvId);
        return new ResponseEntity<>(cvDto, HttpStatus.OK);
    }
}