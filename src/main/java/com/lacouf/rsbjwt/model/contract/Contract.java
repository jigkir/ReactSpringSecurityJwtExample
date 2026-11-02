package com.lacouf.rsbjwt.model.contract;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
public class Contract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @Getter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudentConsent studentConsent;

    @Getter
    @OneToOne
    InternshipApplication internshipApplication;

    @Setter
    @Getter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractStatus contractStatus;

    public Contract(){

    }

    public Contract(InternshipApplication internshipApplication) {
        this.studentConsent = StudentConsent.PENDING;
        this.internshipApplication = internshipApplication;
        this.contractStatus = ContractStatus.PENDING;
    }

}
