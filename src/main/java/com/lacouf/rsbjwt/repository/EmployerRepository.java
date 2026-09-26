package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Employer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployerRepository extends JpaRepository<Employer, Long> {
    Optional<Employer> findByCredentialsEmail(String email);
}
