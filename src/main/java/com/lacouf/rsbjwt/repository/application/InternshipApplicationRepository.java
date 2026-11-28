package com.lacouf.rsbjwt.repository.application;

import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.application.StudentInternshipConsent;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.service.StudentStatusCalculator.StudentCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface InternshipApplicationRepository extends JpaRepository<InternshipApplication, Long> {

    List<InternshipApplication> findByStudentAndInternship_Session(Student student, AcademicSession session);

    boolean existsByStudentAndInternship(Student student, Internship internship);

    boolean existsByCv(CV cv);

    Optional<InternshipApplication> findByIdAndStudent_Credentials_Email(long id, String email);

    List<InternshipApplication> findByInternship_PostedBy_Credentials_EmailAndInternship_SessionAndInternship_DeletedFalse(String email, AcademicSession session);

    Optional<InternshipApplication> findByIdAndInternship_PostedBy_Credentials_EmailAndInternship_DeletedFalse(long id, String email);

    List<InternshipApplication> findByInternship(Internship internship);

    long countByInternship(Internship internship);

    boolean existsByInternship(Internship internship);

    @Query("select internshipApplication.internship.id from InternshipApplication internshipApplication where internshipApplication.student = :student")
    Set<Long> findInternshipIdsByStudent(@Param("student") Student student);

    @Query("select internshipApplication.internship.id from InternshipApplication internshipApplication where internshipApplication.internship.session = :session")
    Set<Long> findInternshipIdsByInternshipSession(@Param("session") AcademicSession session);

    List<InternshipApplication> findByStudentAndEmployerDecision(Student student, EmployerDecision employerDecision);

    List<InternshipApplication> findByStudentAndStudentInternshipConsent(Student student, StudentInternshipConsent studentInternshipConsent);

    @Query("""
    select a.student.id as studentId, count(a) as total
    from InternshipApplication a
    group by a.student.id
    """)
    List<StudentCount> countApplicationsGroupedByStudent();

    @Query("""
    select a.student.id as studentId, count(a) as total
    from InternshipApplication a
    where a.employerDecision = :decision
      and a.studentInternshipConsent = :consent
    group by a.student.id
    """)
    List<StudentCount> countByDecisionAndConsentGroupedByStudent(
            @Param("decision") EmployerDecision decision,
            @Param("consent") StudentInternshipConsent consent);
}
