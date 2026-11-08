package com.lacouf.rsbjwt.presentation.session;

import com.lacouf.rsbjwt.service.dto.response.session.AcademicSessionResponseDto;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class AcademicSessionController {
    private final AcademicSessionService academicSessionService;

    public AcademicSessionController(AcademicSessionService academicSessionService) {
        this.academicSessionService = academicSessionService;
    }

    @GetMapping
    public ResponseEntity<List<AcademicSessionResponseDto>> getSessions() {
        return ResponseEntity.ok(academicSessionService.getSessions());
    }

    @GetMapping("/registration")
    public ResponseEntity<AcademicSessionResponseDto> getRegistrationSession() {
        return ResponseEntity.ok(academicSessionService.getRegistrationSession());
    }
}
