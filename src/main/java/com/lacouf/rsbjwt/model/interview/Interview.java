package com.lacouf.rsbjwt.model.interview;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.user.Employer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Employer employer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private InternshipApplication internshipApplication;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudentDecision studentDecision;

    @Column(nullable = false)
    private LocalDateTime interviewDate;

    public Interview() {
    }

    public Interview(Employer employer, InternshipApplication internshipApplication, String message, LocalDateTime interviewDate) {
        this.employer = employer;
        this.internshipApplication = internshipApplication;
        this.studentDecision = StudentDecision.PENDING;
        this.message = message;
        this.interviewDate = interviewDate;
    }
}
