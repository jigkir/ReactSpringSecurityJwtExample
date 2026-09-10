package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Employer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployerRepository extends JpaRepository<Employer, Long> {
    boolean existsByCredentialsEmail(String email);
}
