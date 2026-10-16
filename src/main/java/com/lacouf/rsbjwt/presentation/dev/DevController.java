package com.lacouf.rsbjwt.presentation.dev;

import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.response.auth.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dev")
public class DevController {
    private final UserAppService userAppService;

    public DevController(UserAppService userAppService) {
        this.userAppService = userAppService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userAppService.getAllDevUsers());
    }

    @PostMapping("/login-as")
    public ResponseEntity<JWTAuthResponse> loginAs(@RequestParam String email) throws UserNotFoundException {
        return ResponseEntity.ok(userAppService.devLoginAs(email));
    }
}