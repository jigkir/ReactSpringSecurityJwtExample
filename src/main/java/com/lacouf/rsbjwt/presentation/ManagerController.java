package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.cv.CvAlreadyReviewedException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.cv.NotificationNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.dto.request.CvRejectionDto;
import com.lacouf.rsbjwt.service.dto.response.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.NotificationDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {
    private final ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> getManagerNotifications(@RequestParam long managerId) throws UserNotFoundException {
        List<NotificationDto> notifications = managerService.getNotificationsForManager(managerId);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<NotificationDto> markNotificationAsRead(@PathVariable long notificationId) throws NotificationNotFoundException {
        NotificationDto updatedNotification = managerService.markNotificationAsRead(notificationId);
        return ResponseEntity.ok(updatedNotification);
    }

    @GetMapping("/cvs")
    public ResponseEntity<List<ManagerCvResponseDto>> getAllPublicCvs() {
        return ResponseEntity.ok(managerService.getAllPublicCvs());
    }

    @GetMapping("/cvs/{cvId}")
    public ResponseEntity<ManagerCvResponseDto> getCv(@PathVariable long cvId) throws CvNotFoundException {
        return ResponseEntity.ok(managerService.getCv(cvId));
    }

    @GetMapping(value = "/cvs", params = "status")
    public ResponseEntity<List<ManagerCvResponseDto>> getPublicCvsByStatus(@RequestParam CvStatus status) {
        return ResponseEntity.ok(managerService.getPublicCvsByStatus(status));
    }

    @GetMapping("/cvs/{cvId}/file")
    public ResponseEntity<CvFileResponseDto> getCvFile(@PathVariable long cvId) throws CvNotFoundException {
        return ResponseEntity.ok(managerService.getCvFile(cvId));
    }

    @PutMapping("/cvs/{cvId}/approve")
    public ResponseEntity<ManagerCvResponseDto> approveCv(@PathVariable long cvId) throws CvNotFoundException, CvAlreadyReviewedException {
        return ResponseEntity.ok(managerService.approveCv(cvId));
    }

    @PutMapping("/cvs/{cvId}/reject")
    public ResponseEntity<ManagerCvResponseDto> rejectCv(@PathVariable long cvId, @Valid @RequestBody CvRejectionDto rejection) throws CvNotFoundException, CvAlreadyReviewedException {
        return ResponseEntity.ok(managerService.rejectCv(cvId, rejection.comment()));
    }
}
