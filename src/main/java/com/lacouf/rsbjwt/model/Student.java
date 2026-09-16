package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity
public class Student extends UserApp {
    @Column(unique = true, nullable = false)
    private String studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Discipline discipline;

    public Student(String firstName, String lastName, String studentId, Credentials credentials, Discipline discipline) {
        super(firstName, lastName, credentials);
        this.studentId = studentId;
        this.discipline = discipline;
    }

    public Student() {
    }

    public String getStudentId() {
        return studentId;
    }

    public Discipline getDiscipline() {
        return discipline;
    }
}
