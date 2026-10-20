package com.lacouf.rsbjwt.repository.interview;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.interview.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Integer> {
    List<Interview> findByEmployer_Credentials_Email(String email);
    boolean existsByInternshipApplication(InternshipApplication internshipApplication);
}
