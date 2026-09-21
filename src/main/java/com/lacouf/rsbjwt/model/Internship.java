package com.lacouf.rsbjwt.model;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

public class Internship {
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

    public Internship(String title, String description, String requiredSkills, String duration, String location, String startDate, String deadline, String compensation, String status, boolean isDeleted){
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
    }
}
