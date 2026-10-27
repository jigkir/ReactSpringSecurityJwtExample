package com.lacouf.rsbjwt.repository.cv;

import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.documents.DocumentVisibility;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface CVRepository extends JpaRepository<CV, Long> {
    List<CV> findByUser(Student student);

    Optional<CV> findByIdAndUser_Credentials_Email(long id, String email);

    long countByUserAndVisibility(Student student, DocumentVisibility visibility);

    List<CV> findByVisibility(DocumentVisibility visibility);

    Optional<CV> findByIdAndVisibility(long id, DocumentVisibility visibility);

    List<CV> findByUser_Credentials_EmailAndStatusAndVisibility(String email, ReviewStatus status, DocumentVisibility visibility);
}
