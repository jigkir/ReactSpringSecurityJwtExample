package com.lacouf.rsbjwt.service.dto.response.contracts;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.internship.Internship;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContractResponseDto(
        long id,
        long applicationId,
        long internshipId,
        String internshipTitle,
        String companyName,
        String location,
        String workMode,
        LocalDate startDate,
        Integer durationInWeeks,
        BigDecimal compensationAmount,
        boolean compensationNegotiable,
        String contractStatus,
        String studentConsent
) {
    public static ContractResponseDto of(Contract contract) {
        InternshipApplication application = contract.getInternshipApplication();
        Internship internship = application.getInternship();

        return new ContractResponseDto(
                contract.getId(),
                application.getId(),
                internship.getId(),
                internship.getTitle(),
                internship.getPostedBy().getCompanyName(),
                internship.getLocation(),
                internship.getWorkMode().name(),
                internship.getStartDate(),
                internship.getDurationInWeeks(),
                internship.getCompensationAmount(),
                internship.isCompensationNegotiable(),
                contract.getContractStatus().name(),
                contract.getStudentConsent().name()
        );
    }
}