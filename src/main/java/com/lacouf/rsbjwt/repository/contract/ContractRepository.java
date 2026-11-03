package com.lacouf.rsbjwt.repository.contract;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.user.Employer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    boolean existsByInternshipApplicationId(long internshipApplicationId);
    Optional<Contract> findByInternshipApplication(InternshipApplication application);
    List<Contract> findByInternshipApplication_Internship_PostedBy(Employer employer);
}
