package com.lacouf.rsbjwt.repository.contract;

import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    boolean existsByStudentAndInternship(Student student, Internship internship);
}
