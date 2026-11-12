package com.lacouf.rsbjwt.model.contract;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "internship_id"}))
public class Contract {
    @Id
    @Setter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Manager manager;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Internship internship;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime managerSignedAt;
    private LocalDateTime studentSignedAt;
    private LocalDateTime employerSignedAt;

    public Contract() {
    }

    public Contract(InternshipApplication acceptedApplication, LocalDateTime createdAt) {
        this.student = acceptedApplication.getStudent();
        this.internship = acceptedApplication.getInternship();
        this.createdAt = createdAt;
    }

    public Employer getEmployer() {
        return internship.getPostedBy();
    }

    public void signAsManager(Manager manager, LocalDateTime signedAt) {
        this.manager = manager;
        this.managerSignedAt = signedAt;
    }

    public LocalDateTime getSignedAtOf(ContractParty party) {
        return switch (party) {
            case STUDENT -> studentSignedAt;
            case EMPLOYER -> employerSignedAt;
            case MANAGER -> managerSignedAt;
        };
    }

    public boolean isSignedBy(ContractParty party) {
        return getSignedAtOf(party) != null;
    }
}
