package com.lacouf.rsbjwt.model.contract;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "internship_id"}))
public class Contract {
    @Id
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

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "image", column = @Column(name = "manager_signature", columnDefinition = "bytea")),
            @AttributeOverride(name = "signedAt", column = @Column(name = "manager_signed_at"))
    })
    private Signature managerSignature;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "image", column = @Column(name = "student_signature", columnDefinition = "bytea")),
            @AttributeOverride(name = "signedAt", column = @Column(name = "student_signed_at"))
    })
    private Signature studentSignature;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "image", column = @Column(name = "employer_signature", columnDefinition = "bytea")),
            @AttributeOverride(name = "signedAt", column = @Column(name = "employer_signed_at"))
    })
    private Signature employerSignature;

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

    public Signature getSignatureOf(ContractParty party) {
        return switch (party) {
            case STUDENT -> studentSignature;
            case EMPLOYER -> employerSignature;
            case MANAGER -> managerSignature;
        };
    }

    public boolean isSignedBy(ContractParty party) {
        return getSignatureOf(party) != null;
    }
}
