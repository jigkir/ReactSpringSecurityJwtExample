package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.model.Internship;
import com.lacouf.rsbjwt.model.InternshipStatus;
import com.lacouf.rsbjwt.model.UserApp;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.repository.EmployerRepository;
import com.lacouf.rsbjwt.model.Employer;
import com.lacouf.rsbjwt.repository.InternshipRepository;
import com.lacouf.rsbjwt.repository.UserAppRepository;
import com.lacouf.rsbjwt.security.exception.InternshipNotFoundException;
import com.lacouf.rsbjwt.security.exception.InvalidInternshipDateException;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class EmployerService {
    private final EmployerRepository employerRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserAppRepository userAppRepository;
    private final InternshipRepository internshipRepository;

    public EmployerService(EmployerRepository employerRepository, PasswordEncoder passwordEncoder, UserAppRepository userAppRepository, InternshipRepository internshipRepository) {
        this.employerRepository = employerRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAppRepository = userAppRepository;
        this.internshipRepository = internshipRepository;
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

    public InternshipResponseDto saveInternship(InternshipRequestDto internshipDto, String employerEmail) throws UserNotFoundException, InvalidInternshipDateException {
        validateInternshipDates(internshipDto.startDate(), internshipDto.applicationDeadline());

        Employer employer = employerRepository.findByCredentialsEmail(employerEmail).orElseThrow(UserNotFoundException::new);

        Internship internship = new Internship(
                internshipDto.title(),
                internshipDto.description(),
                internshipDto.requiredSkills(),
                internshipDto.durationInWeeks(),
                internshipDto.location(),
                internshipDto.startDate(),
                internshipDto.applicationDeadline(),
                internshipDto.compensationAmount(),
                internshipDto.compensationNegotiable(),
                InternshipStatus.PENDING,
                employer
        );

        internshipRepository.save(internship);

        return InternshipResponseDto.of(internship);
    }

    public void deleteInternship(long id, String employerEmail) throws InternshipNotFoundException {
        Internship internship = internshipRepository.findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(id, employerEmail)
                .orElseThrow(() -> new InternshipNotFoundException(id));

        internship.markAsDeleted();

        internshipRepository.save(internship);
    }

    public List<InternshipResponseDto> getInternshipsByEmployerId(long employerId) {
        List<Internship> internships = internshipRepository.findByPostedBy_IdAndDeletedIsFalse(employerId);
        return internships.stream()
                .map(InternshipResponseDto::of)
                .toList();
    }

    private void verifyIfEmployerExists(String email) throws UserAlreadyExistsException {
        Optional<UserApp> employerFoundByEmail = userAppRepository.findByCredentialsEmail(email);

        if (employerFoundByEmail.isPresent()) {
            throw new UserAlreadyExistsException("email");
        }
    }

    private void validateInternshipDates(LocalDate startDate, LocalDate applicationDeadline) throws InvalidInternshipDateException {
        LocalDate today = LocalDate.now();

        if (!startDate.isAfter(today)) {
            throw new InvalidInternshipDateException("start date");
        }

        if (!applicationDeadline.isAfter(today)) {
            throw new InvalidInternshipDateException("application deadline");
        }
    }
}
