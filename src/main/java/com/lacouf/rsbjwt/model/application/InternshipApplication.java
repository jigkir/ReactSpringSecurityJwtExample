package com.lacouf.rsbjwt.model.application;

import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
public class InternshipApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Internship internship;

    @ManyToOne
    private CV cv;

    @ManyToOne
    private Student student;

    @Column
    private LocalDate applicationDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InternshipApplicationStatus internshipApplicationStatus;

    public InternshipApplication() {
    }

    public InternshipApplication(Internship internship, CV cv, Student student) {
        this.internship = internship;
        this.cv = cv;
        this.student = student;
        internshipApplicationStatus = InternshipApplicationStatus.UNREAD;
    }
}
