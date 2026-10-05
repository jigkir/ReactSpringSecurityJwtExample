package com.lacouf.rsbjwt.model.internship;


import com.lacouf.rsbjwt.model.user.Employer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkMode workMode;

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

    @Column(columnDefinition = "TEXT")
    private String rejectionComment;

    @ToString.Exclude
    @ManyToOne
    @JoinColumn(name = "employer_id")
    private Employer postedBy;

    @Column
    private LocalDateTime uploadDate;

    public Internship(String title, String description, String requiredSkills, int durationInWeeks, String location, WorkMode workMode, LocalDate startDate, LocalDate applicationDeadline, BigDecimal compensationAmount, boolean compensationNegotiable, Employer employer) {
        this.title = title;
        this.description = description;
        this.requiredSkills = requiredSkills;
        this.durationInWeeks = durationInWeeks;
        this.location = location;
        this.workMode = workMode;
        this.startDate = startDate;
        this.applicationDeadline = applicationDeadline;
        this.compensationAmount = compensationAmount;
        this.compensationNegotiable = compensationNegotiable;
        this.status = InternshipStatus.PENDING;
        this.postedBy = employer;
        this.deleted = false;
        this.uploadDate = LocalDateTime.now();
    }

    public void update(String title, String description, String requiredSkills, int durationInWeeks,
                       String location, WorkMode workMode, LocalDate startDate, LocalDate applicationDeadline,
                       BigDecimal compensationAmount, boolean compensationNegotiable) {
        this.title = title;
        this.description = description;
        this.requiredSkills = requiredSkills;
        this.durationInWeeks = durationInWeeks;
        this.location = location;
        this.workMode = workMode;
        this.startDate = startDate;
        this.applicationDeadline = applicationDeadline;
        this.compensationAmount = compensationAmount;
        this.compensationNegotiable = compensationNegotiable;
        this.status = InternshipStatus.PENDING;
        this.rejectionComment = null;
    }

    public void markAsDeleted() {
        this.deleted = true;
    }

    public void approve() {
        this.status = InternshipStatus.APPROVED;
        this.rejectionComment = null;
    }

    public void reject(String comment) {
        this.status = InternshipStatus.REJECTED;
        this.rejectionComment = comment;
    }

    public void setId(long id) {
        this.id = id;
    }
}