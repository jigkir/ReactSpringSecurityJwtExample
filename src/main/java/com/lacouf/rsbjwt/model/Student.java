package com.lacouf.rsbjwt.model;

import com.lacouf.rsbjwt.model.auth.Credentials;
import jakarta.persistence.*;

import java.util.Set;

@Entity
public class Student extends UserApp {
    @Column(unique = true, nullable = false)
    private String studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Discipline discipline;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "student")
    private Set<CV> cvs;

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

    public Set<CV> getCvs() {
        return cvs;
    }

    public void addCv(CV cv) {
        this.cvs.add(cv);
        cv.setStudent(this);
    }
}
