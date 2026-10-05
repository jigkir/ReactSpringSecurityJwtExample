package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.notification.NotificationNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.StudentService;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
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
    public ResponseEntity<String> makeCVPrivate(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CVAlreadyPrivateException, CvNotFoundException {
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

    @GetMapping("/{id}/cvs/{cvId}")
    public ResponseEntity<CvFileResponseDto> getCVByStudentIdAndCvId(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException, CorruptedFileException, NoSuchAlgorithmException {
        return ResponseEntity.ok(studentService.getCVByStudentId(id, cvId));
    }

    @GetMapping("/{id}/cvs/{cvId}/status")
    public ResponseEntity<String> getCVStatus(@PathVariable long id, @PathVariable long cvId) throws UserNotFoundException, CvNotFoundException {
        String status = studentService.getCVStatus(id, cvId);
        return new ResponseEntity<>(status, HttpStatus.OK);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> getStudentNotifications(Authentication authentication) {
        List<NotificationDto> notifications = studentService.getStudentNotifications(authentication.getName());
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/notifications/cv/read")
    public ResponseEntity<String> markCvNotificationsAsRead(Authentication authentication) {
        studentService.markCvNotificationsAsRead(authentication.getName());
        return new ResponseEntity<>("Notifications marked as read successfully", HttpStatus.OK);
    }

    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<String> markNotificationAsRead(@PathVariable long notificationId, Authentication authentication) throws NotificationNotFoundException {
        studentService.markNotificationAsRead(notificationId, authentication.getName());
        return new ResponseEntity<>("Notification marked as read successfully", HttpStatus.OK);
    }

    @PutMapping("/notifications/internship/read")
    public ResponseEntity<String> markInternshipsNotificationsAsRead(Authentication authentication) {
        studentService.markInternshipsNotificationAsRead(authentication.getName());
        return new ResponseEntity<>("Notifications marked as read successfully", HttpStatus.OK);
    }

    @GetMapping("/notifications/internship/unread/count")
    public ResponseEntity<Long> getUnreadInternshipNotificationsCount(Authentication authentication) {
        long unreadCount = studentService.getUnreadNotificationCountForInternships(authentication.getName());
        return new ResponseEntity<>(unreadCount, HttpStatus.OK);
    }
}