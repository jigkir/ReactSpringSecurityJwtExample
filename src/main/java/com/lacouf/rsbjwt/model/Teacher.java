package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity
public class Teacher extends UserApp{
    @Column(unique = true, nullable = false)
    private String teacherId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Discipline discipline;

    public Teacher(String firstName, String lastName, String teacherId, Credentials credentials, Discipline discipline) {
        super(firstName, lastName, credentials);
        this.teacherId = teacherId;
        this.discipline = discipline;
    }

    public Teacher() {}

    public Discipline getDiscipline() {
        return discipline;
    }

    public String getTeacherId() {
        return teacherId;
    }
}
