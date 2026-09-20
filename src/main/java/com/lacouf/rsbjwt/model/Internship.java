package com.lacouf.rsbjwt.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Inheritance(strategy = InheritanceType.JOINED)

public abstract class Internship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String description;
    private String requiredSkills;
    private String duration;
    private String location;
    private String startDate;
    private String deadline;
    private String compensation;
    private String status;
    private Boolean isDeleted;
    @ToString.Exclude
    @ManyToOne
    @JoinColumn(name = "employer_id")
    private Employer postedBy;
}
