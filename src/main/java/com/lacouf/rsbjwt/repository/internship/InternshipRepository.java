package com.lacouf.rsbjwt.repository.internship;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InternshipRepository extends JpaRepository<Internship, Long> {
    Optional<Internship> findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(long id, String employerEmail);

    List<Internship> findByStatusAndDeletedFalse(ReviewStatus status);

    Optional<Internship> findByIdAndDeletedFalse(long id);

    List<Internship> findByDeletedFalse();

    List<Internship> findByPostedBy_Credentials_EmailAndDeletedIsFalse(String email);

    List<Internship> findByPostedBy_DisciplineAndDeletedIsFalse(Discipline postedByDiscipline);
}