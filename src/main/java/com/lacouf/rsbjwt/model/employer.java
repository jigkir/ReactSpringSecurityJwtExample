package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;

@Entity
@Getter
public class employer extends UserApp {
    @Column(name = "company_name")
    private String companyName;

    @Column(name = "activity_sector")
    private String activitySector;

    @Column(name = "phone_number")
    private String phoneNumber;

    public employer(String firstName, String lastName, Credentials credentials, String companyName, String activitySector, String phoneNumber) {
        super(firstName, lastName, credentials);
        this.activitySector = activitySector;
        this.companyName = companyName;
        this.phoneNumber = phoneNumber;
    }

    public employer() {

    }
}
