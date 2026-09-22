package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.security.exception.*;
import com.lacouf.rsbjwt.service.StudentService;
import com.lacouf.rsbjwt.service.dto.CVDto;
import com.lacouf.rsbjwt.service.dto.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
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
            @PathVariable Long id) throws CorruptedFileException, InvalidFileTypeException, IOException, NoSuchAlgorithmException, InvalidFileSizeException, UserNotFoundException {

        studentService.uploadCV(file, id);
        return new ResponseEntity<>("CV uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/{id}/cvs")
    public ResponseEntity<List<CVDto>> getStudentCVs(@PathVariable Long id)
            throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {

        Student student = studentService.findById(id);
        List<CVDto> cvDtos = studentService.getCVs(student);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(cvDtos);
    }

    @GetMapping("/{id}/cvs/count")
    public ResponseEntity<Long> getCVCount(@PathVariable Long id) throws UserNotFoundException {
        Student student = studentService.findById(id);
        long cvCount = studentService.getCVCountByStudent(student);
        return new ResponseEntity<>(cvCount, HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/hide")
    public ResponseEntity<String> hideCV(@PathVariable Long id, @PathVariable Long cvId) throws UserNotFoundException, CvNotFoundException {
        Student student = studentService.findById(id);
        studentService.setCvAsInvisible(student, cvId);
        return new ResponseEntity<>("CV hidden successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/public")
    public ResponseEntity<String> makeCVPublic(@PathVariable Long id, @PathVariable Long cvId) throws UserNotFoundException, CVAlreadyPublicException, CvNotFoundException {
        Student student = studentService.findById(id);
        studentService.setCvAsPublic(student, cvId);
        return new ResponseEntity<>("CV made public successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/private")
    public ResponseEntity<String> makeCVPrivate(@PathVariable Long id, @PathVariable Long cvId) throws UserNotFoundException, CVAlredyPrivateException, CvNotFoundException {
        Student student = studentService.findById(id);
        studentService.setCvAsPrivate(student, cvId);
        return new ResponseEntity<>("CV made private successfully", HttpStatus.OK);
    }



}