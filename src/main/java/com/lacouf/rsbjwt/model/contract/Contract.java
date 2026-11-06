package com.lacouf.rsbjwt.model.contract;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
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
    @OneToOne (fetch = FetchType.LAZY, optional = false)
    private InternshipApplication internshipApplication;

    public Contract(){

    }

    public Contract(InternshipApplication internshipApplication) {
        this.internshipApplication = internshipApplication;
    }

}
