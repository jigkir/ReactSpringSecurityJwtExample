package com.lacouf.rsbjwt.presentation;


import com.lacouf.rsbjwt.security.exception.InternshipNotFoundException;
import com.lacouf.rsbjwt.security.exception.InvalidInternshipDateException;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.EmployerService;
import com.lacouf.rsbjwt.service.dto.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employer")
public class EmployerController {
    private final EmployerService employerService;

    public EmployerController(EmployerService employerService) {
        this.employerService = employerService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserResponseDto> save(@Valid @RequestBody EmployerSignUpDto employerSignUpDto) throws UserAlreadyExistsException {
        UserResponseDto userResponseDto = employerService.save(employerSignUpDto);
        return new ResponseEntity<>(userResponseDto, HttpStatus.CREATED);
    }

    @PostMapping("/internship")
    public ResponseEntity<InternshipResponseDto> createInternship(@Valid @RequestBody InternshipRequestDto internshipRequestDto, Authentication authentication) throws UserNotFoundException, InvalidInternshipDateException {
        InternshipResponseDto internshipResponseDto = employerService.saveInternship(internshipRequestDto, authentication.getName());
        return new ResponseEntity<>(internshipResponseDto, HttpStatus.CREATED);
    }

    @DeleteMapping("/internships/{internshipId}")
    public ResponseEntity<Void> deleteInternship(@PathVariable long internshipId, Authentication authentication) throws InternshipNotFoundException {
        employerService.deleteInternship(internshipId, authentication.getName());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{employerId}/internships")
    public ResponseEntity<List<InternshipResponseDto>> getInternshipsOfEmployer(@PathVariable long employerId) {
        return ResponseEntity.ok(employerService.getInternshipsByEmployerId(employerId));
    }
}
