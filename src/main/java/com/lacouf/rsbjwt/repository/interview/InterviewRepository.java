package com.lacouf.rsbjwt.repository.interview;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.interview.InterviewStatus;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    Optional<Interview> findByIdAndEmployer_Credentials_Email(Long id, String email);
    List<Interview> findByEmployer_Credentials_EmailAndInternshipApplication_Internship_DeletedFalse(String email);
    List<Interview> findByInternshipApplication (InternshipApplication internshipApplication);
    List<Interview> findByInternshipApplication_Internship(Internship internship);
    boolean existsByInternshipApplicationAndInterviewStatus(InternshipApplication application, InterviewStatus status);
    List<Interview> findByInternshipApplication_Student(Student student);
}
