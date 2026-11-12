package com.lacouf.rsbjwt.repository.users;

import com.lacouf.rsbjwt.model.user.Manager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ManagerRepository extends JpaRepository<Manager, Long> {
    
    Optional<Manager> findByCredentialsEmail(String email);
}
