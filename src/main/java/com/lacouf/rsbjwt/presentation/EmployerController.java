package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.service.EmployerService;
import com.lacouf.rsbjwt.service.dto.EmployerDTO;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/employer")
public class EmployerController {
    private final EmployerService employerService;

    public EmployerController(EmployerService employerService) {
        this.employerService = employerService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> save(@Valid @RequestBody EmployerDTO employerDTO) {
        if (employerService.employerExists(employerDTO.email())) {
            throw new IllegalArgumentException("Un employeur avec ce email existe déja.");
        }
        UserResponseDto userResponseDto = employerService.save(employerDTO);
        return new ResponseEntity<>(userResponseDto, HttpStatus.CREATED);
    }
}
