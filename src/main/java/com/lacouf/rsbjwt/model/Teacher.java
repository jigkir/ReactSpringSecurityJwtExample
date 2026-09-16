package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Teacher extends UserApp{
    @Column(nullable = false)
    private Discipline discipline;

    public Teacher(String firstName, String lastName, Credentials credentials, Discipline discipline) {
        super(firstName, lastName, credentials);
        this.discipline = discipline;
    }

    public Teacher() {}

    public Discipline getDiscipline() {
        return discipline;
    }
}
