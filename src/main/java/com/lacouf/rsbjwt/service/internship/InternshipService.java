package com.lacouf.rsbjwt.service.internship;

import com.lacouf.rsbjwt.exception.internship.InternshipWithApplicationsNotEditableException;
import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.repository.application.InternshipApplicationRepository;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class InternshipService {
    private static final String START_DATE_LABEL = "start date";
    private static final String APPLICATION_DEADLINE_LABEL = "application deadline";

    private final InternshipApplicationRepository internshipApplicationRepository;

    public InternshipService(InternshipApplicationRepository internshipApplicationRepository) {
        this.internshipApplicationRepository = internshipApplicationRepository;
    }

    public void validateNewInternship(InternshipRequestDto internshipRequestDto) throws InvalidInternshipDateException, InvalidCompensationException {
        validateDateIsInFuture(internshipRequestDto.startDate(), START_DATE_LABEL);
        validateDateIsInFuture(internshipRequestDto.applicationDeadline(), APPLICATION_DEADLINE_LABEL);

        validateCompensation(internshipRequestDto.compensationAmount(), internshipRequestDto.compensationNegotiable());
    }

    public void updateDetails(Internship internship, InternshipRequestDto internshipRequestDto, AcademicSession session) throws InvalidInternshipDateException, InvalidCompensationException, InternshipWithApplicationsNotEditableException {
        verifyIfInternshipHasApplications(internship);

        LocalDate startDate = internshipRequestDto.startDate();
        LocalDate applicationDeadline = internshipRequestDto.applicationDeadline();

        if (!startDate.equals(internship.getStartDate())) {
            validateDateIsInFuture(startDate, START_DATE_LABEL);
        }
        if (!applicationDeadline.equals(internship.getApplicationDeadline())) {
            validateDateIsInFuture(applicationDeadline, APPLICATION_DEADLINE_LABEL);
        }

        validateCompensation(internshipRequestDto.compensationAmount(), internshipRequestDto.compensationNegotiable());

        internship.update(
                internshipRequestDto.title(),
                internshipRequestDto.description(),
                internshipRequestDto.requiredSkills(),
                internshipRequestDto.durationInWeeks(),
                internshipRequestDto.location(),
                internshipRequestDto.workMode(),
                internshipRequestDto.startDate(),
                internshipRequestDto.applicationDeadline(),
                internshipRequestDto.compensationAmount(),
                internshipRequestDto.compensationNegotiable(),
                session
        );
    }

    public boolean isUnchanged(Internship internship, InternshipRequestDto internshipRequestDto) {
        return internship.getTitle().equals(internshipRequestDto.title())
                && internship.getDescription().equals(internshipRequestDto.description())
                && internship.getRequiredSkills().equals(internshipRequestDto.requiredSkills())
                && internship.getDurationInWeeks() == internshipRequestDto.durationInWeeks()
                && internship.getLocation().equals(internshipRequestDto.location())
                && internship.getWorkMode() == internshipRequestDto.workMode()
                && internship.getStartDate().equals(internshipRequestDto.startDate())
                && internship.getApplicationDeadline().equals(internshipRequestDto.applicationDeadline())
                && isSameAmount(internship.getCompensationAmount(), internshipRequestDto.compensationAmount())
                && internship.isCompensationNegotiable() == internshipRequestDto.compensationNegotiable();
    }

    private void verifyIfInternshipHasApplications(Internship internship) throws InternshipWithApplicationsNotEditableException {
        if (internshipApplicationRepository.existsByInternship(internship)) {
            throw new InternshipWithApplicationsNotEditableException(internship.getId());
        }
    }

    private void validateDateIsInFuture(LocalDate date, String label) throws InvalidInternshipDateException {
        if (!date.isAfter(LocalDate.now())) {
            throw new InvalidInternshipDateException(label);
        }
    }

    private void validateCompensation(BigDecimal amount, boolean negotiable) throws InvalidCompensationException {
        if (amount == null && !negotiable) {
            throw new InvalidCompensationException();
        }
    }

    private boolean isSameAmount(BigDecimal current, BigDecimal requested) {
        return current == null ? requested == null : requested != null && current.compareTo(requested) == 0;
    }
}
