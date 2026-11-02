package com.lacouf.rsbjwt.repository.contract;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractStatus;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    boolean existsByInternshipApplicationId(long internshipApplicationId);
    Optional<Contract> findByIdAndInternshipApplication_Student_Credentials_Email(long id, String email);
    List<Contract> findByInternshipApplication_StudentAndContractStatus(Student student, ContractStatus status);
    Optional<Contract> findByInternshipApplication(InternshipApplication application);
    List<Contract> findByInternshipApplication_Student(Student student);
    List<Contract> findByInternshipApplication_Internship_PostedBy(Employer employer);
}
