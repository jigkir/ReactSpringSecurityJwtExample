package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
public class Employer extends UserApp {

    @Column
    private String companyName;

    @Column
    private String activitySector;

    @Column
    private String phoneNumber;

    public Employer(String firstName, String lastName, Credentials credentials, String companyName, String activitySector, String phoneNumber) {
        super(firstName, lastName, credentials);
        this.companyName = companyName;
        this.activitySector = activitySector;
        this.phoneNumber = phoneNumber;
    }

    public Employer() {
    }

}
