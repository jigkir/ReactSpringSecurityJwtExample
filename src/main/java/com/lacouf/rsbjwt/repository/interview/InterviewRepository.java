package com.lacouf.rsbjwt.repository.interview;

import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.interview.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Integer> {
    List<Interview> findByEmployer_Credentials_Email(String email);
    boolean existsByInternshipApplication(InternshipApplication internshipApplication);
    Optional<Interview> findByIdAndEmployer_Credentials_Email(Long id, String email);
}
