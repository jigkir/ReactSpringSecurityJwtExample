package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.CV;
import com.lacouf.rsbjwt.model.CvPriority;
import com.lacouf.rsbjwt.model.Student;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


@Repository
public interface CVRepository extends JpaRepository<CV, Long> {
    long countByStudent(Student student);
    List<CV> findByStudent(Student student);
    CV findByStudentAndPriority(Student student, CvPriority priority);
}
