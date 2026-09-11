package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {
}
