package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.StudentService;
import com.lacouf.rsbjwt.service.dto.request.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.response.NotificationDto;
import com.lacouf.rsbjwt.service.dto.response.*;
import com.lacouf.rsbjwt.service.dto.request.StudentSignUpDto;
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
    private final ManagerService managerService;

    public StudentController(StudentService studentService, ManagerService managerService) {
        this.studentService = studentService;
        this.managerService = managerService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> save(@Valid @RequestBody StudentSignUpDto studentSignUpDto) throws UserAlreadyExistsException {
        UserResponseDto signedUpStudent = studentService.save(studentSignUpDto);
        return new ResponseEntity<>(signedUpStudent, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/cvs")
    public ResponseEntity<String> uploadCV(@RequestParam("file") MultipartFile file, @PathVariable long id) throws IOException, UserNotFoundException, InvalidFileTypeException, NoSuchAlgorithmException, CorruptedFileException, InvalidFileSizeException {
        CvUploadDto upload = new CvUploadDto(file.getBytes(), file.getOriginalFilename());

        studentService.uploadCV(upload, id);

        return new ResponseEntity<>("CV uploaded successfully", HttpStatus.CREATED);
    }

    @GetMapping("/{id}/cvs")
    public ResponseEntity<List<StudentCvResponseDto>> getStudentCVs(@PathVariable long id)
            throws CorruptedFileException, UserNotFoundException, NoSuchAlgorithmException {

        List<StudentCvResponseDto> studentCvResponseDtos = studentService.getCVs(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(studentCvResponseDtos);
    }

    @GetMapping("/{id}/cvs/count")
    public ResponseEntity<Long> getCVCount(@PathVariable long id) throws UserNotFoundException {
        long cvCount = studentService.getCVCountByStudentId(id);
        return new ResponseEntity<>(cvCount, HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/hide")
    public ResponseEntity<String> hideCV(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        studentService.setCvAsInvisible(id, cvId);
        return new ResponseEntity<>("CV hidden successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/public")
    public ResponseEntity<String> makeCVPublic(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CVAlreadyPublicException, CvNotFoundException {
        studentService.setCvAsPublic(id, cvId);
        return new ResponseEntity<>("CV made public successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/private")
    public ResponseEntity<String> makeCVPrivate(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CVAlredyPrivateException, CvNotFoundException {
        studentService.setCvAsPrivate(id, cvId);
        return new ResponseEntity<>("CV made private successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/secondary")
    public ResponseEntity<String> makeCVSecondary(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        studentService.setCVAsSecondary(id, cvId);
        return new ResponseEntity<>("CV made secondary successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/main")
    public ResponseEntity<String> makeCVMain(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        studentService.setCVAsMain(id, cvId);
        return new ResponseEntity<>("CV made main successfully", HttpStatus.OK);
    }

    @PutMapping("/{id}/cvs/{cvId}/pending")
    public ResponseEntity<String> makeCVPending(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        studentService.setCVAsPending(id, cvId);
        managerService.addNewCVNotificationToManager("New CV Pending Review", "A new CV has been submitted for review.", cvId);
        return new ResponseEntity<>("CV made pending successfully", HttpStatus.OK);
    }

    @GetMapping("/{id}/cvs/{cvId}")
    public ResponseEntity<CvFileResponseDto> getCVByStudentIdAndCvId(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        return ResponseEntity.ok(studentService.getCVByStudentId(id, cvId));
    }

    @GetMapping("/{id}/cvs/{cvId}/status")
    public ResponseEntity<String> getCVStatus(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        String status = studentService.getCVStatus(id, cvId);
        return new ResponseEntity<>(status, HttpStatus.OK);
    }

    @GetMapping("/{id}/internships")
    public ResponseEntity<List<InternshipResponseDto>> getStudentInternships(@PathVariable long id) throws UserNotFoundException {
        List<InternshipResponseDto> internships = studentService.getStudentInternships(id);
        return ResponseEntity.ok(internships);
    }

    @GetMapping("/{id}/notifications")
    public ResponseEntity<List<NotificationDto>> getStudentNotifications(@PathVariable long id) throws UserNotFoundException {
        List<NotificationDto> notifications = studentService.getStudentNotifications(id);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/notifications/{notificationId}/read")
    public ResponseEntity<String> markNotificationAsRead(@PathVariable long id, @PathVariable long notificationId) throws UserNotFoundException {
        studentService.markNotificationAsRead(id, notificationId);
        return new ResponseEntity<>("Notification marked as read successfully", HttpStatus.OK);
    }

    @GetMapping("/{id}/notifications/unread/count")
    public ResponseEntity<Long> getUnreadNotificationCount(@PathVariable long id) throws UserNotFoundException {
        long unreadCount = studentService.getUnreadNotificationCount(id);
        return new ResponseEntity<>(unreadCount, HttpStatus.OK);
    }
}