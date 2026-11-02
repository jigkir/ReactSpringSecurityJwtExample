package com.lacouf.rsbjwt.repository.application;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface InternshipApplicationRepository extends JpaRepository<InternshipApplication, Long> {
    List<InternshipApplication> findByStudent(Student student);

    boolean existsByStudentAndInternship(Student student, Internship internship);

    Optional<InternshipApplication> findByIdAndStudent_Credentials_Email(long id, String email);

    List<InternshipApplication> findByInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(String email);

    Optional<InternshipApplication> findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(long id, String email);

    List<InternshipApplication> findByInternship(Internship internship);

    long countByInternship(Internship internship);

    @Query("select internshipApplication.internship.id from InternshipApplication internshipApplication where internshipApplication.student = :student")
    Set<Long> findInternshipIdsByStudent(@Param("student") Student student);
}
