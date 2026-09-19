package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.service.CVService;
import com.lacouf.rsbjwt.service.UserAppService;
import com.lacouf.rsbjwt.service.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class UserController {

	private final UserAppService userService;
	private final CVService cvService;

	@PostMapping("/login")
	public ResponseEntity<JWTAuthResponse> authenticateUser(@RequestBody LoginDTO loginDto){
		try {
			String accessToken = userService.authenticateUser(loginDto);
			final JWTAuthResponse authResponse = new JWTAuthResponse(accessToken);
			return ResponseEntity.accepted()
					.contentType(MediaType.APPLICATION_JSON)
					.body(authResponse);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new JWTAuthResponse());
		}
	}

	@GetMapping("/me")
	public ResponseEntity<UserDTO> getMe(HttpServletRequest request){
		return ResponseEntity.accepted().contentType(MediaType.APPLICATION_JSON).body(
			userService.getMe(request.getHeader("Authorization")));
	}

	@GetMapping("/gestionnaire/demo")
	@PreAuthorize("hasAuthority('GESTIONNAIRE')")
	public ResponseEntity<String> gestionnaireDemoEndpoint() {
		return ResponseEntity.ok("tout est beau");
	}

	@GetMapping("/disciplines")
	public ResponseEntity<DisciplineDto> getAllDisciplines() {
		return ResponseEntity.ok(userService.getAllDisciplines());
	}

	@GetMapping("/roles")
	public ResponseEntity<RoleDto> getAllRoles() {
		return ResponseEntity.ok(userService.getAllRoles());
	}

	@GetMapping("/get-max-cv-size")
	public ResponseEntity<Integer> getMaxCVSize() {
		return ResponseEntity.ok(cvService.getMaxCVSize());
	}
}
