package com.lacouf.rsbjwt.model.user;

import com.lacouf.rsbjwt.model.documents.student.cv.CV;
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

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "user")
    private Set<CV> cvs = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "StudentViewedInternship",
            joinColumns = @JoinColumn(name = "studentId"),
            inverseJoinColumns = @JoinColumn(name = "internshipId")
    )
    private Set<Internship> viewedInternships;

    @ManyToMany
    @JoinTable(
            name = "StudentHiddenInternship",
            joinColumns = @JoinColumn(name = "studentId"),
            inverseJoinColumns = @JoinColumn(name = "internshipId")
    )
    private Set<Internship> hiddenInternships;

    @ManyToMany
    @JoinTable(
            name = "StudentFavoriteInternship",
            joinColumns = @JoinColumn(name = "studentId"),
            inverseJoinColumns = @JoinColumn(name = "internshipId")
    )
    private Set<Internship> favoriteInternships;

    public Student(String firstName, String lastName, String studentId, Credentials credentials, Discipline discipline) {
        super(firstName, lastName, credentials);
        this.studentId = studentId;
        this.discipline = discipline;
        this.viewedInternships = new HashSet<>();
        this.hiddenInternships = new HashSet<>();
        this.favoriteInternships = new HashSet<>();
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

    public void hide(Internship internship) {
        hiddenInternships.add(internship);
    }

    public void unhide(Internship internship) {
        hiddenInternships.remove(internship);
    }

    public void addToFavorites(Internship internship) {
        favoriteInternships.add(internship);
    }

    public void removeFromFavorites(Internship internship) {
        favoriteInternships.remove(internship);
    }
}
