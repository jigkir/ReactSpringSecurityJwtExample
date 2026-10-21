package com.lacouf.rsbjwt.repository.users;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentId(String studentId);

    List<Student> findByDiscipline(Discipline discipline);

    Optional<Student> findByCredentialsEmail(String email);

    @Query("select i.id from Student s join s.viewedInternships i where s = :student")
    Set<Long> findViewedInternshipIds(@Param("student") Student student);
}
