package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.auth.Role;

import java.util.List;

public record RoleDto(List<String> roles) {
    public static RoleDto of(List<Role> roles) {
        return new RoleDto(roles.stream().map(Role::name).toList());
    }
}
