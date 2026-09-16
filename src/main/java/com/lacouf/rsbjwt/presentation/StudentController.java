package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.security.exception.CorruptedFileException;
import com.lacouf.rsbjwt.security.exception.InvalidFileTypeException;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.CVService;
import com.lacouf.rsbjwt.service.StudentService;
import com.lacouf.rsbjwt.service.dto.CVDto;
import com.lacouf.rsbjwt.service.dto.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/student")
public class StudentController {
    private final StudentService studentService;
    private final CVService cvService;

    public StudentController(StudentService studentService, CVService cvService) {
        this.studentService = studentService;
        this.cvService = cvService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> save(@Valid @RequestBody StudentSignUpDto studentSignUpDto) throws UserAlreadyExistsException {
        UserResponseDto signedUpStudent = studentService.save(studentSignUpDto);

        return new ResponseEntity<>(signedUpStudent, HttpStatus.CREATED);
    }

    @PostMapping("/upload-cv")
    public ResponseEntity<String> uploadCV(
            @RequestParam("file") MultipartFile file,
            @RequestParam("studentId") String studentId,
            @RequestParam("fileName") String fileName) throws CorruptedFileException, InvalidFileTypeException, IOException {

        if (file == null || file.isEmpty()) {
            throw new InvalidFileTypeException("Uploaded file is empty or null.");
        }

        Student student = studentService.findByStudentId(studentId);
        if (student == null) {
            return new ResponseEntity<>("Student not found", HttpStatus.NOT_FOUND);
        }

        byte[] bytes = file.getBytes();
        if (bytes == null || bytes.length == 0) {
            throw new InvalidFileTypeException("Uploaded file contains no data.");
        }

        cvService.saveCV(new CVDto(fileName, bytes), student);
        return new ResponseEntity<>("CV uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/download-cv/{studentId}")
    public ResponseEntity<byte[]> downloadCV(@PathVariable String studentId) throws CorruptedFileException {
        Student student = studentService.findByStudentId(studentId);
        if (student == null || student.getCv() == null) {
            return ResponseEntity.notFound().build();
        }

        CVDto cvDto = cvService.getCVByStudent(student);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + cvDto.fileName() + "\"")
                .body(cvDto.content());
    }
}
