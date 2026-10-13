package com.lacouf.rsbjwt.repository.application;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InternshipApplicationRepository extends JpaRepository<InternshipApplication, Long> {
    List<InternshipApplication> findByStudent(Student student);

    List<InternshipApplication> findByInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(String email);

    Optional<InternshipApplication> findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(long id, String email);
}
