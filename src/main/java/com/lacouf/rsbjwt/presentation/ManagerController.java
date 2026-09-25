package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.dto.NotificationDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {
    private ManagerService managerService;

    public ManagerController(ManagerService managerService) {
        this.managerService = managerService;
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> getManagerNotifications(@RequestParam Long managerId) throws UserNotFoundException {
        List<NotificationDto> notifications = managerService.getNotificationsForManager(managerId);
        return ResponseEntity.ok(notifications);
    }
}
