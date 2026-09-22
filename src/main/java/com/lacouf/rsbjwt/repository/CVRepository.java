package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.CV;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


@Repository
public interface CVRepository extends JpaRepository<CV, Long> {
    long countByStudent_StudentId(String studentId);
    List<CV> findByStudent_StudentId(String studentId);
}
