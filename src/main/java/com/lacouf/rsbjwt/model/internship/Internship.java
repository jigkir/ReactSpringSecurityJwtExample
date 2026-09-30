package com.lacouf.rsbjwt.model.internship;


import com.lacouf.rsbjwt.model.user.Employer;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@NoArgsConstructor
@Getter
public class Internship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String requiredSkills;

    @Column(nullable = false)
    private int durationInWeeks;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate applicationDeadline;

    private BigDecimal compensationAmount;

    private boolean compensationNegotiable;

    @Column(nullable = false)
    private boolean deleted;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InternshipStatus status;

    @ToString.Exclude
    @ManyToOne
    @JoinColumn(name = "employer_id")
    private Employer postedBy;

    public Internship(String title, String description, String requiredSkills, int durationInWeeks, String location, LocalDate startDate, LocalDate applicationDeadline, BigDecimal compensationAmount, boolean compensationNegotiable, InternshipStatus status, Employer employer){
        this.title = title;
        this.description = description;
        this.requiredSkills = requiredSkills;
        this.durationInWeeks = durationInWeeks;
        this.location = location;
        this.startDate = startDate;
        this.applicationDeadline = applicationDeadline;
        this.compensationAmount = compensationAmount;
        this.compensationNegotiable = compensationNegotiable;
        this.status = status;
        this.postedBy = employer;
        this.deleted = false;
    }

    public void markAsDeleted() {
        this.deleted = true;
    }

    public void approve() {
        this.status = InternshipStatus.APPROVED;
    }

    public void reject() {
        this.status = InternshipStatus.REJECTED;
    }

    public void setId(long id) {
        this.id = id;
    }
}