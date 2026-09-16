package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.*;

@Entity
public class Student extends UserApp {
    @Column(unique = true, nullable = false)
    private String studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Discipline discipline;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "cv_id", referencedColumnName = "id")
    private CV cv;

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
