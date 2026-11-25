package com.lacouf.rsbjwt.repository.contract;

import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    boolean existsByStudentAndInternship(Student student, Internship internship);

    boolean existsByInternship(Internship internship);

    List<Contract> findByInternship_Session(AcademicSession session);

    @Query("select contract.internship.id from Contract contract where contract.internship.postedBy.credentials.email = :email")
    Set<Long> findInternshipIdsOfEmployer(@Param("email") String email);

    boolean existsByStudentAndStudentSignedAtIsNull(Student student);

    boolean existsByStudentAndStudentSignedAtIsNotNull(Student student);
}
