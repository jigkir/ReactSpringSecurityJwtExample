package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Internship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InternshipRepository extends JpaRepository<Internship, Long> {
    List<Internship> findByPostedBy_IdAndDeletedIsFalse(Long id);
    Optional<Internship> findByIdAndPostedBy_Credentials_EmailAndDeletedFalse(long id, String employerEmail);
}
