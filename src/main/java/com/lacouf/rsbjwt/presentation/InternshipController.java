package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.security.exception.InternshipNotFoundException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.EmployerService;
import com.lacouf.rsbjwt.service.UserAppService;
import com.lacouf.rsbjwt.service.dto.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.InternshipResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internship")
public class InternshipController {
    private final EmployerService employerService;
    private final UserAppService userAppService;

    public InternshipController(EmployerService employerService, UserAppService userAppService){
        this.employerService = employerService;
        this.userAppService = userAppService;
    }

    @PostMapping("/make")
    public ResponseEntity<InternshipResponseDto> save(@Valid @RequestBody InternshipRequestDto internshipRequestDto){
        InternshipResponseDto internshipResponseDto = employerService.save(internshipRequestDto);
        return new ResponseEntity<>(internshipResponseDto, HttpStatus.CREATED);
    }

    @PutMapping("/delete")
    public ResponseEntity<InternshipResponseDto> delete(@RequestParam Long id) throws InternshipNotFoundException {
        InternshipResponseDto internshipResponseDto = employerService.deleteInternship(id);
        return new ResponseEntity<>(internshipResponseDto,HttpStatus.OK);
    }

    @GetMapping("/made")
    public ResponseEntity<List<InternshipResponseDto>> getInternshipMadeByMe (Authentication authentication) throws UserNotFoundException {
        String email = authentication.getName();
        Long employerId = userAppService.getUserByEmail(email).id();
        List<InternshipResponseDto> internshipResponseDtos = employerService.getInternshipsByEmployerId(employerId);
        return ResponseEntity.ok(internshipResponseDtos);
    }

    @GetMapping("/all")
    public ResponseEntity<List<InternshipResponseDto>> getAllActiveInternships(){
        List<InternshipResponseDto> internshipResponseDtos = employerService.getAllActiveInternships();
        return ResponseEntity.ok(internshipResponseDtos);
    }
}
