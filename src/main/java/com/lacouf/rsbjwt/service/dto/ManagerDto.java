package com.lacouf.rsbjwt.service.dto;

import com.lacouf.rsbjwt.model.Manager;
import com.lacouf.rsbjwt.model.auth.Role;
import lombok.Builder;

public class ManagerDto extends UserDTO {
    private String matricule;
    private String phoneNumber;;

    @Builder
    public ManagerDto(Long id, String firstName, String lastname,
                      String email, Role role, String matricule, String phoneNumber) {
        super(id, firstName, lastname, email, role);
        this.matricule = matricule;
        this.phoneNumber = phoneNumber;
    }

    public ManagerDto() {}

    public static ManagerDto create(Manager manager) {
        return ManagerDto.builder()
                .id(manager.getId())
                .firstName(manager.getFirstName())
                .lastname(manager.getLastName())
                .email(manager.getEmail())
                .role(manager.getRole())
                .phoneNumber(manager.getPhoneNumber())
                .build();
    }

    public static ManagerDto empty() {
        return new ManagerDto();
    }
}
