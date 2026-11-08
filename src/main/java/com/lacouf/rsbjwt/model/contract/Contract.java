package com.lacouf.rsbjwt.model.contract;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
public class Contract {
    @Getter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    Employer employer;

    @Getter
    @OneToOne(fetch = FetchType.LAZY)
    Student student;

    @Getter
    @OneToOne(fetch = FetchType.LAZY)
    InternshipApplication internshipApplication;

    public Contract(){

    }

    public Contract(InternshipApplication internshipApplication) {
        this.internshipApplication = internshipApplication;
        this.student = internshipApplication.getStudent();
        this.employer = internshipApplication.getInternship().getPostedBy();
    }

}
