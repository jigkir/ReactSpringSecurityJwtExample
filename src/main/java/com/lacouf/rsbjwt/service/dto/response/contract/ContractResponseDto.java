package com.lacouf.rsbjwt.service.dto.response.contract;

import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ContractResponseDto(
        long id,
        InternshipResponseDto internship,
        LocalDate internshipEndDate,
        String studentName,
        String employerName,
        String companyName,
        String managerName,
        LocalDateTime createdAt,
        LocalDateTime studentSignedAt,
        LocalDateTime employerSignedAt,
        LocalDateTime managerSignedAt
) {
    public static ContractResponseDto of(Contract contract) {
        Internship internship = contract.getInternship();
        Student student = contract.getStudent();
        Employer employer = contract.getEmployer();

        return new ContractResponseDto(
                contract.getId(),
                InternshipResponseDto.of(contract.getInternship()),
                internship.getEndDate(),
                student.getFullName(),
                employer.getFullName(),
                employer.getCompanyName(),
                nameOf(contract.getManager()),
                contract.getCreatedAt(),
                contract.getStudentSignedAt(),
                contract.getEmployerSignedAt(),
                contract.getManagerSignedAt()
        );
    }

    private static String nameOf(Manager manager) {
        return manager == null ? null : manager.getFullName();
    }
}