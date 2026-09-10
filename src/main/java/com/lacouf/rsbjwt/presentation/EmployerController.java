package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.service.EmployerService;
import com.lacouf.rsbjwt.service.dto.EmployerDTO;
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
    public ResponseEntity<EmployerDTO> save(@RequestBody EmployerDTO employerDTO) {
        if (employerService.employerExists(employerDTO.email())) {
            throw new IllegalArgumentException("An employer with this email already exists.");
        }
        employerService.save(employerDTO);
        return ResponseEntity.status(201).build();
    }
}
