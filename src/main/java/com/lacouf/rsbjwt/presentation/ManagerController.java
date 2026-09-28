package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.exception.cv.CvAlreadyReviewedException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.dto.response.CVDto;
import com.lacouf.rsbjwt.service.dto.response.NotificationDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {
    private ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> getManagerNotifications(@RequestParam long managerId) throws UserNotFoundException {
        List<NotificationDto> notifications = managerService.getNotificationsForManager(managerId);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<NotificationDto> markNotificationAsRead(@PathVariable long notificationId) throws UserNotFoundException {
        NotificationDto updatedNotification = managerService.markNotificationAsRead(notificationId);
        return ResponseEntity.ok(updatedNotification);
    }

    @GetMapping("/cvs/pending")
    public ResponseEntity<List<CVDto>> getPendingPublicCvs() {
        return ResponseEntity.ok(managerService.getPendingPublicCvs());
    }

    @PutMapping("cvs/{cvId}/approve")
    public ResponseEntity<CVDto> approveCV(@PathVariable long cvId) throws CvNotFoundException, CvAlreadyReviewedException {
        return ResponseEntity.ok(managerService.approveCv(cvId));
    }

    @PutMapping("cvs/{cvId}/reject")
    public ResponseEntity<CVDto> rejectCV(@PathVariable long cvId) throws CvNotFoundException, CvAlreadyReviewedException {
        return ResponseEntity.ok(managerService.rejectCv(cvId));
    }
}
