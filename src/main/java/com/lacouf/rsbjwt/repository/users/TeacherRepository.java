package com.lacouf.rsbjwt.repository.users;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByTeacherId(String teacherId);
    List<Teacher> findByDiscipline(Discipline discipline);
}
