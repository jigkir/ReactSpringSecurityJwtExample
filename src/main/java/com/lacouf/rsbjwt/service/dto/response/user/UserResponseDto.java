package com.lacouf.rsbjwt.service.dto.response.user;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.Teacher;
import com.lacouf.rsbjwt.model.user.UserApp;

public record UserResponseDto(long id, String firstName, String lastName, String email, String role, Discipline discipline) {

    public UserResponseDto(long id, String firstName, String lastName, String email, String role) {
        this(id, firstName, lastName, email, role, null);
    }

    public static UserResponseDto of(UserApp userApp) {
        return new UserResponseDto(
                userApp.getId(),
                userApp.getFirstName(),
                userApp.getLastName(),
                userApp.getEmail(),
                userApp.getRole().toString(),
                disciplineOf(userApp)
        );
    }

    // Managers have no discipline
    private static Discipline disciplineOf(UserApp userApp) {
        return switch (userApp) {
            case Student student -> student.getDiscipline();
            case Teacher teacher -> teacher.getDiscipline();
            case Employer employer -> employer.getDiscipline();
            default -> null;
        };
    }
}