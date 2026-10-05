package com.lacouf.rsbjwt.repository.users;

import com.lacouf.rsbjwt.model.user.Employer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployerRepository extends JpaRepository<Employer, Long> {
    Optional<Employer> findByCredentialsEmail(String email);
}
