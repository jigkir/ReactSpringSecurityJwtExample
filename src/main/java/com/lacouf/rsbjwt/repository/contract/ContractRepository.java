package com.lacouf.rsbjwt.repository.contract;

import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.service.StudentStatusCalculator.StudentCount;
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

    long countByStudentAndStudentSignedAtIsNull(Student student);

    long countByStudentAndStudentSignedAtIsNotNull(Student student);

    @Query("""
    select c.student.id as studentId, count(c) as total
    from Contract c
    where c.studentSignedAt is null
    group by c.student.id
    """)
    List<StudentCount> countToSignGroupedByStudent();

    @Query("""
    select c.student.id as studentId, count(c) as total
    from Contract c
    where c.studentSignedAt is not null
    group by c.student.id
    """)
    List<StudentCount> countSignedGroupedByStudent();
}
