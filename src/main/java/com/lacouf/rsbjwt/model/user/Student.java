package com.lacouf.rsbjwt.model.user;

import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.internship.Internship;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
public class Student extends UserApp {
    @Column(unique = true, nullable = false)
    private String studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Discipline discipline;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "student")
    private Set<CV> cvs = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "StudentViewedInternship",
            joinColumns = @JoinColumn(name = "studentId"),
            inverseJoinColumns = @JoinColumn(name = "internshipId")
    )
    private Set<Internship> viewedInternships;

    public Student(String firstName, String lastName, String studentId, Credentials credentials, Discipline discipline) {
        super(firstName, lastName, credentials);
        this.studentId = studentId;
        this.discipline = discipline;
        this.viewedInternships = new HashSet<>();
    }

    public Student() {
    }

    public String getStudentId() {
        return studentId;
    }

    public Discipline getDiscipline() {
        return discipline;
    }

    public void addCv(CV cv) {
        this.cvs.add(cv);
        cv.setStudent(this);
    }

    public void markViewed(Internship internship) {
        viewedInternships.add(internship);
    }
}
