package com.lacouf.rsbjwt.repository.application;

import com.lacouf.rsbjwt.model.application.Application;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    public List<Application> findByStudent(Student student);
}
