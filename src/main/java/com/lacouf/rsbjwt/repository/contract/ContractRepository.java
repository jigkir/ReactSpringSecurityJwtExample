package com.lacouf.rsbjwt.repository.contract;

import com.lacouf.rsbjwt.model.contract.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    boolean existsByInternshipApplicationId(long internshipApplicationId);
}
