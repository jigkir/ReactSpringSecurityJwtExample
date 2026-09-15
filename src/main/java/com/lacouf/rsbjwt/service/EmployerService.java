package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.EmployerRepository;
import com.lacouf.rsbjwt.model.Employer;
import com.lacouf.rsbjwt.service.dto.EmployerRegistrationDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class EmployerService {
    private final EmployerRepository employerRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployerService(EmployerRepository employerRepository, PasswordEncoder passwordEncoder) {
        this.employerRepository = employerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponseDto save(EmployerRegistrationDto employerDTO){
        Credentials credentials = Credentials.builder()
                .email(employerDTO.email())
                .password(passwordEncoder.encode(employerDTO.password()))
                .role(Role.EMPLOYER)
                .build();

        Employer employer = new Employer(
                employerDTO.firstName(),
                employerDTO.lastName(),
                credentials,
                employerDTO.companyName(),
                employerDTO.activitySector(),
                employerDTO.phoneNumber()
        );

        employerRepository.save(employer);

        return UserResponseDto.of(employer);
    }

    public boolean employerExists(String email) {
        return employerRepository.existsByCredentialsEmail(email);
    }
}
