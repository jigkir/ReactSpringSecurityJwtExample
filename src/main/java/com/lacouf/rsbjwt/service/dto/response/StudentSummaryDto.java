package com.lacouf.rsbjwt.service.dto.response;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.Student;

public record StudentSummaryDto(
        long id,
        String firstName,
        String lastName,
        String email,
        String studentId,
        Discipline discipline
) {
    public static StudentSummaryDto of(Student student) {
        return new StudentSummaryDto(
                student.getId(),
                student.getFirstName(),
                student.getLastName(),
                student.getEmail(),
                student.getStudentId(),
                student.getDiscipline()
        );
    }
}
