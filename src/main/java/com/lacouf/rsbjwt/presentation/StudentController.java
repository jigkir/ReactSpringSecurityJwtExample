package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.model.CVSharingScope;
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

    @PostMapping("/{studentId}/cvs")
    public ResponseEntity<String> uploadCV(
            @RequestParam("file") MultipartFile file,
            @PathVariable String studentId) throws CorruptedFileException, InvalidFileTypeException, IOException, NoSuchAlgorithmException, InvalidFileSizeException, UserNotFoundException {

        if (file == null || file.isEmpty()) {
            throw new InvalidFileTypeException("Uploaded file is empty or null.");
        }

        Student student = studentService.findByStudentId(studentId);

        byte[] bytes = file.getBytes();
        if (bytes.length == 0) {
            throw new InvalidFileTypeException("Uploaded file contains no data.");
        }

        studentService.saveCV(new CVDto(bytes, null, CVSharingScope.PRIVATE), student); //null
        return new ResponseEntity<>("CV uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/{studentId}/cvs")
    public ResponseEntity<List<CVDto>> getStudentCVs(@PathVariable String studentId)
            throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {

        Student student = studentService.findByStudentId(studentId);
        List<CVDto> cvDtos = studentService.getCVs(student);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(cvDtos);
    }

    @GetMapping("/{studentId}/cvs/count")
    public ResponseEntity<Long> getCVCount(@PathVariable String studentId) throws UserNotFoundException {
        Student student = studentService.findByStudentId(studentId);
        long cvCount = studentService.getCVCountByStudent(student);
        return new ResponseEntity<>(cvCount, HttpStatus.OK);
    }

    @PutMapping("/{studentId}/cvs/{cvId}/hide")
    public ResponseEntity<String> hideCV(@PathVariable String studentId, @PathVariable Long cvId) throws UserNotFoundException {
        Student student = studentService.findByStudentId(studentId);
        studentService.setCvAsInvisible(student, cvId);
        return new ResponseEntity<>("CV hidden successfully", HttpStatus.OK);
    }

    @PutMapping("/{studentId}/cvs/{cvId}/public")
    public ResponseEntity<String> makeCVPublic(@PathVariable String studentId, @PathVariable Long cvId) throws UserNotFoundException, CVAlreadyPublicException {
        Student student = studentService.findByStudentId(studentId);
        studentService.setCvAsPublic(student, cvId);
        return new ResponseEntity<>("CV made public successfully", HttpStatus.OK);
    }

    @PutMapping("/{studentId}/cvs/{cvId}/private")
    public ResponseEntity<String> makeCVPrivate(@PathVariable String studentId, @PathVariable Long cvId) throws UserNotFoundException, CVAlredyPrivateException {
        Student student = studentService.findByStudentId(studentId);
        studentService.setCvAsPrivate(student, cvId);
        return new ResponseEntity<>("CV made private successfully", HttpStatus.OK);
    }



}
