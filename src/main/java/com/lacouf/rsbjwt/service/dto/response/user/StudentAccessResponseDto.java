package com.lacouf.rsbjwt.service.dto.response.user;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.AccountStatus;
import com.lacouf.rsbjwt.model.user.Student;

public record StudentAccessResponseDto(
        long id,
        String firstName,
        String lastName,
        String email,
        String studentId,
        Discipline discipline,
        AccountStatus status
) {
    public static StudentAccessResponseDto of(Student student, AccountStatus status) {
        return new StudentAccessResponseDto(
                student.getId(),
                student.getFirstName(),
                student.getLastName(),
                student.getEmail(),
                student.getStudentId(),
                student.getDiscipline(),
                status
        );
    }
}
