package com.lacouf.rsbjwt.service;

import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.users.EmployerRepository;
import com.lacouf.rsbjwt.repository.InternshipRepository;
import com.lacouf.rsbjwt.repository.users.UserAppRepository;
import com.lacouf.rsbjwt.service.dto.request.signup.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

    public InternshipResponseDto saveInternship(InternshipRequestDto internshipDto, String employerEmail) throws UserNotFoundException, InvalidInternshipDateException, InvalidCompensationException {
        requireFuture(internshipDto.startDate(), "start date");
        requireFuture(internshipDto.applicationDeadline(), "application deadline");

        validateCompensation(internshipDto.compensationAmount(), internshipDto.compensationNegotiable());

        Employer employer = employerRepository.findByCredentialsEmail(employerEmail).orElseThrow(UserNotFoundException::new);

        Internship internship = new Internship(
                internshipDto.title(),
                internshipDto.description(),
                internshipDto.requiredSkills(),
                internshipDto.durationInWeeks(),
                internshipDto.location(),
                internshipDto.workMode(),
                internshipDto.startDate(),
                internshipDto.applicationDeadline(),
                internshipDto.compensationAmount(),
                internshipDto.compensationNegotiable(),
                employer
        );

        internshipRepository.save(internship);

        return InternshipResponseDto.of(internship);
    }

    public InternshipResponseDto updateInternship(long id, InternshipRequestDto dto, String employerEmail) throws InternshipNotFoundException, InvalidInternshipDateException, InvalidCompensationException {
        // Ownership check: only the employer who posted the offer can edit it
        Internship internship = internshipRepository
                .findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(id, employerEmail)
                .orElseThrow(() -> new InternshipNotFoundException(id));

        // Only re-validate dates that changed (an unchanged, now-past date is accepted)
        if (!dto.startDate().equals(internship.getStartDate())) {
            requireFuture(dto.startDate(), "start date");
        }
        if (!dto.applicationDeadline().equals(internship.getApplicationDeadline())) {
            requireFuture(dto.applicationDeadline(), "application deadline");
        }

        validateCompensation(dto.compensationAmount(), dto.compensationNegotiable());

        internship.update(
                dto.title(),
                dto.description(),
                dto.requiredSkills(),
                dto.durationInWeeks(),
                dto.location(),
                dto.workMode(),
                dto.startDate(),
                dto.applicationDeadline(),
                dto.compensationAmount(),
                dto.compensationNegotiable()
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

    public List<InternshipResponseDto> getInternshipsOfEmployer(String email) {
        List<Internship> internships = internshipRepository.findByPostedBy_Credentials_EmailAndDeletedIsFalse(email);
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

    private void requireFuture(LocalDate date, String label) throws InvalidInternshipDateException {
        if (!date.isAfter(LocalDate.now())) {
            throw new InvalidInternshipDateException(label);
        }
    }

    private void validateCompensation(BigDecimal amount, boolean negotiable) throws InvalidCompensationException {
        if (amount == null && !negotiable) {
            throw new InvalidCompensationException();
        }
    }
}
