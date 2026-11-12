package com.lacouf.rsbjwt.repository.contract;

import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    boolean existsByStudentAndInternship(Student student, Internship internship);

    List<Contract> findByInternship_Session(AcademicSession session);
}
