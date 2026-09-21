package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.UserApp;

public record UserResponseDto(long id, String firstName, String lastName, String email, String role) {
    public static UserResponseDto of(UserApp userApp) {
        return new UserResponseDto(userApp.getId(), userApp.getFirstName(), userApp.getLastName(), userApp.getEmail(), userApp.getRole().toString());
    }
}