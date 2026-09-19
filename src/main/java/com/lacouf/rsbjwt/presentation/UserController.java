package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.UserAppService;
import com.lacouf.rsbjwt.service.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class UserController {

	private final UserAppService userAppService;

	@PostMapping("/login")
	public ResponseEntity<JWTAuthResponse> login(@Valid @RequestBody UserLoginDTO userLoginDto) {
		return ResponseEntity.ok(userAppService.login(userLoginDto));
	}

	@GetMapping("/users/current")
	public ResponseEntity<UserResponseDto> getCurrentUser(Authentication authentication) throws UserNotFoundException {
		return ResponseEntity.ok(userAppService.getUserByEmail(authentication.getName()));
	}

	@GetMapping("/manager/demo")
	@PreAuthorize("hasAuthority('MANAGER')")
	public ResponseEntity<String> managerDemoEndpoint() {
		return ResponseEntity.ok("tout est beau");
	}

	@GetMapping("/disciplines")
	public ResponseEntity<DisciplineDto> getAllDisciplines() {
		return ResponseEntity.ok(userAppService.getAllDisciplines());
	}

	@GetMapping("/roles")
	public ResponseEntity<RoleDto> getAllRoles() {
		return ResponseEntity.ok(userAppService.getAllRoles());
	}
}
