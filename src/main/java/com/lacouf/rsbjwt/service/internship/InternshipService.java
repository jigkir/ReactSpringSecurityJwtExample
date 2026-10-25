package com.lacouf.rsbjwt.service.internship;

import com.lacouf.rsbjwt.exception.internship.InvalidCompensationException;
import com.lacouf.rsbjwt.exception.internship.InvalidInternshipDateException;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class InternshipService {
    private static final String START_DATE_LABEL = "start date";
    private static final String APPLICATION_DEADLINE_LABEL = "application deadline";

    public void validateNewInternship(InternshipRequestDto internshipRequestDto) throws InvalidInternshipDateException, InvalidCompensationException {
        validateDateIsInFuture(internshipRequestDto.startDate(), START_DATE_LABEL);
        validateDateIsInFuture(internshipRequestDto.applicationDeadline(), APPLICATION_DEADLINE_LABEL);

        validateCompensation(internshipRequestDto.compensationAmount(), internshipRequestDto.compensationNegotiable());
    }

    public void updateDetails(Internship internship, InternshipRequestDto internshipRequestDto) throws InvalidInternshipDateException, InvalidCompensationException {
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
                internshipRequestDto.compensationNegotiable()
        );
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
}
