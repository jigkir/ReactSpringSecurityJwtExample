package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.CV;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


@Repository
public interface CVRepository extends JpaRepository<CV, Long> {
    long countByStudent_StudentId(String studentId);
    Optional<CV> findTopByStudent_StudentIdOrderByUploadDateDesc(String studentId);
}
