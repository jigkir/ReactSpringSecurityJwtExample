package com.lacouf.rsbjwt.repository.internship;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InternshipRepository extends JpaRepository<Internship, Long> {
    Optional<Internship> findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(long id, String employerEmail);

    Optional<Internship> findByIdAndDeletedFalse(long id);

    List<Internship> findByPostedBy_Credentials_EmailAndDeletedIsFalse(String email);

    List<Internship> findByPostedBy_DisciplineAndStatusAndDeletedFalseAndApplicationDeadlineGreaterThanEqual(Discipline discipline, ReviewStatus status, LocalDate date);

    List<Internship> findByIdInAndDeletedFalseAndStatusAndPostedBy_Discipline(
            Collection<Long> ids, ReviewStatus status, Discipline discipline);

    Optional<Internship> findByIdAndDeletedFalseAndStatusAndPostedBy_Discipline(long id, ReviewStatus status, Discipline discipline);

    List<Internship> findByStatusAndDeletedFalse(ReviewStatus status);

    List<Internship> findBySessionAndDeletedFalse(AcademicSession session);

    List<Internship> findByPostedBy_Credentials_EmailAndSessionAndDeletedIsFalse(String email, AcademicSession session);

    List<Internship> findByPostedBy_DisciplineAndSessionAndDeletedIsFalse(Discipline postedByDiscipline, AcademicSession session);
}