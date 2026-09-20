package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.model.Student;
import com.lacouf.rsbjwt.security.exception.*;
import com.lacouf.rsbjwt.service.CVService;
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
            @RequestParam("studentId") String studentId) throws CorruptedFileException, InvalidFileTypeException, IOException, NoSuchAlgorithmException, InvalidFileSizeException, UserNotFoundException {

        if (file == null || file.isEmpty()) {
            throw new InvalidFileTypeException("Uploaded file is empty or null.");
        }

        Student student = studentService.findByStudentId(studentId);

        byte[] bytes = file.getBytes();
        if (bytes.length == 0) {
            throw new InvalidFileTypeException("Uploaded file contains no data.");
        }

        cvService.saveCV(new CVDto(bytes), student);
        return new ResponseEntity<>("CV uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/download-cv/{studentId}")
    public ResponseEntity<byte[]> downloadCV(@PathVariable String studentId) throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {
        Student student = studentService.findByStudentId(studentId);

        CVDto cvDto = cvService.getMostRecentCVByStudent(student);

        ContentDisposition contentDisposition = ContentDisposition.builder("inline")
                .filename("cv_" + studentId + ".pdf")
                .build();

        return ResponseEntity.ok()
                .headers(headers -> {
                    headers.setContentDisposition(contentDisposition);
                    headers.add("X-Content-Type-Options", "nosniff");
                    headers.setContentLength(cvDto.content().length);
                })
                .contentType(MediaType.APPLICATION_PDF)
                .body(cvDto.content());
    }

    @GetMapping("/cv-count/{studentId}")
    public ResponseEntity<Long> getCVCount(@PathVariable String studentId) throws UserNotFoundException {
        Student student = studentService.findByStudentId(studentId);
        long cvCount = cvService.getCVCountByStudent(student);
        return new ResponseEntity<>(cvCount, HttpStatus.OK);
    }

}
