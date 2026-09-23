package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.Internship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternshipRepository extends JpaRepository<Internship, Long> {
    List<Internship> findByPostedBy_IdAndIsDeletedIsFalse(Long id);
    List<Internship> findByIsDeletedFalse();
}
