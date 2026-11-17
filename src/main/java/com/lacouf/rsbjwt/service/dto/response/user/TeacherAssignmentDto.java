package com.lacouf.rsbjwt.service.dto.response.user;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.Teacher;

public record TeacherAssignmentDto(
        Long id,
        String firstName,
        String lastName,
        Discipline discipline,
        String email,
        long numberOfStudentsAssigned
) {

    public static TeacherAssignmentDto of(Teacher teacher, long numberOfStudentsAssigned) {
        return new TeacherAssignmentDto(
                teacher.getId(),
                teacher.getFirstName(),
                teacher.getLastName(),
                teacher.getDiscipline(),
                teacher.getEmail(),
                numberOfStudentsAssigned
        );
    }
}