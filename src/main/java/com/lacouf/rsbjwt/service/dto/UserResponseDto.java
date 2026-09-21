package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.UserApp;

public record UserResponseDto(long id, String firstName, String lastName, String email, String role, String studentId) {
    public static UserResponseDto of(UserApp userApp) {
        String studentId = null;
        if (userApp instanceof com.lacouf.rsbjwt.model.Student s) {
            studentId = s.getStudentId();
        }
        return new UserResponseDto(userApp.getId(), userApp.getFirstName(), userApp.getLastName(), userApp.getEmail(), userApp.getRole().toString(), studentId);
    }
}