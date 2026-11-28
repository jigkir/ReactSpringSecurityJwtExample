package com.lacouf.rsbjwt.repository.interview;

import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.interview.Interview;
import com.lacouf.rsbjwt.model.interview.InterviewStatus;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.service.StudentStatusCalculator.StudentCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InterviewRepository extends JpaRepository<Interview, Long> {

    Optional<Interview> findByIdAndEmployer_Credentials_Email(Long id, String email);

    List<Interview> findByEmployer_Credentials_EmailAndInternshipApplication_Internship_DeletedFalse(String email);

    List<Interview> findByInternshipApplication(InternshipApplication internshipApplication);

    List<Interview> findByInternshipApplication_Internship(Internship internship);

    boolean existsByInternshipApplicationAndInterviewStatus(InternshipApplication application, InterviewStatus status);

    List<Interview> findByInternshipApplication_Student(Student student);

    Optional<Interview> findByIdAndInternshipApplication_Student_Credentials_Email(Long id, String email);

    List<Interview> findByInternshipApplication_StudentAndInterviewStatusAndInterviewDateAfter(Student student, InterviewStatus interviewStatus, LocalDateTime date);

    long countByInternshipApplication_StudentAndInterviewDateAfter(Student student, LocalDateTime date);

    long countByInternshipApplication_StudentAndInternshipApplication_EmployerDecisionAndInterviewDateBefore(Student student, EmployerDecision employerDecision, LocalDateTime date);

    @Query("""
    select i.internshipApplication.student.id as studentId, count(i) as total
    from Interview i
    where i.interviewDate > :now
    group by i.internshipApplication.student.id
    """)
    List<StudentCount> countUpcomingGroupedByStudent(@Param("now") LocalDateTime now);

    @Query("""
    select i.internshipApplication.student.id as studentId, count(i) as total
    from Interview i
    where i.internshipApplication.employerDecision = :decision
      and i.interviewDate < :now
    group by i.internshipApplication.student.id
    """)
    List<StudentCount> countAwaitingGroupedByStudent(
            @Param("decision") EmployerDecision decision,
            @Param("now") LocalDateTime now);
}
