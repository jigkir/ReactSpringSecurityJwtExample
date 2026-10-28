package com.lacouf.rsbjwt.model.application;

import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "internship_id"}))
public class InternshipApplication {
    @Id
    @Setter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Internship internship;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private CV cv;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Student student;

    @Column
    private LocalDate applicationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmployerDecision employerDecision;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InternshipApplicationStatus internshipApplicationStatus;

    public InternshipApplication() {
    }

    public InternshipApplication(Internship internship, CV cv, Student student) {
        this.internship = internship;
        this.cv = cv;
        this.student = student;
        this.internshipApplicationStatus = InternshipApplicationStatus.UNREAD;
        this.applicationDate = LocalDate.now();
        this.employerDecision = EmployerDecision.PENDING;
    }

    public void markAsRead() {
        internshipApplicationStatus = InternshipApplicationStatus.READ;
    }

    public void changeCv(CV cv) {
        this.cv = cv;
    }

    public void updateEmployerDecision(EmployerDecision decision) {
        this.employerDecision = decision;
    }
}
