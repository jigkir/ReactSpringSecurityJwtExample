package com.lacouf.rsbjwt.model;


import jakarta.persistence.*;
import lombok.*;

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

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String requiredSkills;

    @Column(nullable = false)
    private String duration;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate deadline;

    @Column(nullable = false)
    private String compensation;

    @Column(nullable = false)
    private Boolean isDeleted;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InternshipStatus status;

    @ToString.Exclude
    @ManyToOne
    @JoinColumn(name = "employer_id")
    private Employer postedBy;

    public Internship(String title, String description, String requiredSkills, String duration, String location, LocalDate startDate, LocalDate deadline, String compensation, InternshipStatus status, boolean isDeleted, Employer employer){
        this.title = title;
        this.description = description;
        this.requiredSkills = requiredSkills;
        this.duration = duration;
        this.location = location;
        this.startDate = startDate;
        this.deadline = deadline;
        this.compensation = compensation;
        this.status = status;
        this.isDeleted = isDeleted;
        this.postedBy = employer;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }
}
