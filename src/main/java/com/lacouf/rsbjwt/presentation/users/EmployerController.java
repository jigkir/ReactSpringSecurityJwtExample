package com.lacouf.rsbjwt.presentation.users;


import com.lacouf.rsbjwt.exception.application.ApplicationRejectedException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.exception.interview.InterviewAlreadyExistsException;
import com.lacouf.rsbjwt.exception.interview.InterviewCancelledException;
import com.lacouf.rsbjwt.exception.interview.InterviewAlreadyPassedException;
import com.lacouf.rsbjwt.exception.interview.InterviewNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.interview.InterviewRequestDto;
import com.lacouf.rsbjwt.service.dto.response.application.ReceivedInternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.interview.InterviewEmployerResponseDTO;
import com.lacouf.rsbjwt.service.dto.response.interview.MeetingTypeDTO;
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
    public ResponseEntity<DocumentFileResponseDto> openReceivedInternshipApplicationCv(@PathVariable long applicationId, Authentication authentication) throws InternshipApplicationNotFoundException {
        return ResponseEntity.ok(employerService.openReceivedInternshipApplicationCv(applicationId, authentication.getName()));
    }

    @GetMapping("/applications/count")
    public ResponseEntity<Map<Long, Long>> countReceivedInternshipApplicationsByInternship(Authentication authentication) {
        return ResponseEntity.ok(employerService.countReceivedInternshipApplicationsByInternship(authentication.getName()));
    }

    @PutMapping("/applications/{applicationId}/accept")
    public ResponseEntity<Void> acceptReceivedInternshipApplication(@PathVariable long applicationId, Authentication authentication) throws InternshipApplicationNotFoundException {
        employerService.acceptInternshipApplication(applicationId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/applications/{applicationId}/reject")
    public ResponseEntity<Void> rejectReceivedInternshipApplication(@PathVariable long applicationId, Authentication authentication) throws InternshipApplicationNotFoundException {
        employerService.rejectInternshipApplication(applicationId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{applicationId}/interview")
    public ResponseEntity<Void> createInterview(@Valid @RequestBody InterviewRequestDto interviewRequestDto, @PathVariable long applicationId, Authentication authentication) throws InternshipApplicationNotFoundException, InterviewAlreadyExistsException, ApplicationRejectedException {
        employerService.createInterview(applicationId, authentication.getName(), interviewRequestDto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/interviews")
    public ResponseEntity<List<InterviewEmployerResponseDTO>> getInterviewsOfEmployer(Authentication authentication) {
        return ResponseEntity.ok(employerService.getInterviewsOfEmployer(authentication.getName()));
    }

    @GetMapping("/{applicationId}/interviews")
    public ResponseEntity<List<InterviewEmployerResponseDTO>> getInterviewsByApplicationId(@PathVariable long applicationId, Authentication authentication) throws InternshipApplicationNotFoundException {
        List<InterviewEmployerResponseDTO> interviews = employerService.getInterviewsByApplicationId(applicationId, authentication.getName());
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/interviews/meeting-types")
    public ResponseEntity<MeetingTypeDTO> getMeetingTypes() {
        return ResponseEntity.ok(employerService.getMeetingTypes());
    }

    @PutMapping("/interviews/{interviewId}")
    public ResponseEntity<InterviewEmployerResponseDTO> updateInterview(@PathVariable long interviewId, @Valid @RequestBody InterviewRequestDto interviewRequestDto, Authentication authentication) throws InterviewNotFoundException, InterviewCancelledException, InterviewAlreadyPassedException {
        InterviewEmployerResponseDTO interview = employerService.updateInterview(interviewId, authentication.getName(), interviewRequestDto);
        return ResponseEntity.ok(interview);
    }

    @PutMapping("/interviews/{interviewId}/cancel")
    public ResponseEntity<InterviewEmployerResponseDTO> cancelInterview(@PathVariable long interviewId, Authentication authentication) throws InterviewNotFoundException, InterviewCancelledException, InterviewAlreadyPassedException {
        InterviewEmployerResponseDTO interview = employerService.cancelInterview(interviewId, authentication.getName());
        return ResponseEntity.ok(interview);
    }
}

