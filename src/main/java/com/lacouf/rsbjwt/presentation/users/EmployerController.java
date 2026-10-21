package com.lacouf.rsbjwt.presentation.users;


import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.exception.interview.InterviewAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.interview.InterviewRequestDto;
import com.lacouf.rsbjwt.service.dto.response.application.ReceivedInternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.interview.InterviewEmployerResponseDTO;
import com.lacouf.rsbjwt.service.users.EmployerService;
import com.lacouf.rsbjwt.service.dto.request.signup.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<InternshipResponseDto> createInternship(@Valid @RequestBody InternshipRequestDto internshipRequestDto, Authentication authentication) throws UserNotFoundException, InvalidInternshipDateException, InvalidCompensationException {
        InternshipResponseDto internshipResponseDto = employerService.saveInternship(internshipRequestDto, authentication.getName());
        return new ResponseEntity<>(internshipResponseDto, HttpStatus.CREATED);
    }

    @PutMapping("/internships/{internshipId}")
    public ResponseEntity<InternshipResponseDto> updateInternship(@PathVariable long internshipId, @Valid @RequestBody InternshipRequestDto internshipRequestDto, Authentication authentication) throws InternshipNotFoundException, InvalidInternshipDateException, InvalidCompensationException {
        return ResponseEntity.ok(employerService.updateInternship(internshipId, internshipRequestDto, authentication.getName()));
    }

    @DeleteMapping("/internships/{internshipId}")
    public ResponseEntity<Void> deleteInternship(@PathVariable long internshipId, Authentication authentication) throws InternshipNotFoundException {
        employerService.deleteInternship(internshipId, authentication.getName());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/internships")
    public ResponseEntity<List<InternshipResponseDto>> getInternshipsOfEmployer(Authentication authentication) {
        return ResponseEntity.ok(employerService.getInternshipsOfEmployer(authentication.getName()));
    }

    @GetMapping("/applications")
    public ResponseEntity<List<ReceivedInternshipApplicationResponseDto>> getReceivedInternshipApplications(Authentication authentication) {
        return ResponseEntity.ok(employerService.getReceivedInternshipApplications(authentication.getName()));
    }

    @GetMapping("/applications/{applicationId}/cv")
    public ResponseEntity<CvFileResponseDto> openReceivedInternshipApplicationCv(@PathVariable long applicationId, Authentication authentication) throws InternshipApplicationNotFoundException {
        return ResponseEntity.ok(employerService.openReceivedInternshipApplicationCv(applicationId, authentication.getName()));
    }

    @GetMapping("/applications/count")
    public ResponseEntity<Map<Long, Long>> countReceivedInternshipApplicationsByInternship(Authentication authentication) {
        return ResponseEntity.ok(employerService.countReceivedInternshipApplicationsByInternship(authentication.getName()));
    }

    @PostMapping("/applications/{applicationId}/accept")
    public ResponseEntity<Void> acceptReceivedInternshipApplication(@Valid @RequestBody InterviewRequestDto interviewRequestDto, @PathVariable long applicationId, Authentication authentication) throws InternshipApplicationNotFoundException, UserNotFoundException, InterviewAlreadyExistsException {
        employerService.createInterview(applicationId, authentication.getName(), interviewRequestDto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/interviews")
    public ResponseEntity<List<InterviewEmployerResponseDTO>> getInterviewsOfEmployer(Authentication authentication) {
        return ResponseEntity.ok(employerService.getInterviewsOfEmployer(authentication.getName()));
    }

    @GetMapping("/interviews/meeting-types")
    public ResponseEntity<List<String>> getMeetingTypes() {
        return ResponseEntity.ok(employerService.getMeetingTypes());
    }
}
