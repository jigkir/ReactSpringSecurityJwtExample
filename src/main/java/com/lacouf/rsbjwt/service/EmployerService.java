package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.UserApp;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.EmployerRepository;
import com.lacouf.rsbjwt.model.Employer;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.dto.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EmployerService {
    private final EmployerRepository employerRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;

    public EmployerService(EmployerRepository employerRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository) {
        this.employerRepository = employerRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
    }

    public UserResponseDto save(EmployerSignUpDto employerDTO) throws UserAlreadyExistsException {

        verifyIfEmployerExists(employerDTO.email());

        Credentials credentials = Credentials.builder()
                .email(employerDTO.email())
                .password(passwordEncoder.encode(employerDTO.password()))
                .role(Role.EMPLOYER)
                .build();

        String phoneNumber = employerDTO.phoneNumber();
        String formattedPhoneNumber = phoneNumber.replaceFirst("^([0-9]{3})([0-9]{3})([0-9]{4})$", "$1-$2-$3");

        Employer employer = new Employer(
                employerDTO.firstName(),
                employerDTO.lastName(),
                credentials,
                employerDTO.companyName(),
                employerDTO.discipline(),
                formattedPhoneNumber
        );

        employerRepository.save(employer);

        return UserResponseDto.of(employer);
    }

    public void verifyIfEmployerExists(String email) throws UserAlreadyExistsException {
        Optional<UserApp> employerFoundByEmail = userAppRepository.findByCredentialsEmail(email);

        if (employerFoundByEmail.isPresent()) {
            throw new UserAlreadyExistsException();
        }
    }
}
