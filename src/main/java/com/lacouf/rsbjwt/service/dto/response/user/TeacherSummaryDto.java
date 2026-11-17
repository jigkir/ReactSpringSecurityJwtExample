package com.lacouf.rsbjwt.service.dto.response.user;


import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.Teacher;

public record TeacherSummaryDto(Long id, String firstName, String lastName, Discipline discipline, String email) {

    public static TeacherSummaryDto of (Teacher teacher) {
        return new TeacherSummaryDto(
                teacher.getId(),
                teacher.getFirstName(),
                teacher.getLastName(),
                teacher.getDiscipline(),
                teacher.getEmail()
        );
    }
}
