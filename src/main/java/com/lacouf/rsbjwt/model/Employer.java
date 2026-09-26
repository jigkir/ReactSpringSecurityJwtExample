package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Getter
public class Employer extends UserApp {

    @Column(nullable = false)
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Discipline discipline;

    @Column(nullable = false)
    private String phoneNumber;

    public Employer(String firstName, String lastName, Credentials credentials, String companyName, Discipline discipline, String phoneNumber) {
        super(firstName, lastName, credentials);
        this.companyName = companyName;
        this.discipline = discipline;
        this.phoneNumber = phoneNumber;
    }

    public Employer() {
    }

}
