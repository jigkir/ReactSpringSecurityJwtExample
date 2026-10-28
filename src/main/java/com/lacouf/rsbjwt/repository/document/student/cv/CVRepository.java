package com.lacouf.rsbjwt.repository.document.student.cv;

import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.repository.document.DocumentRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface CVRepository extends DocumentRepository<CV> {

    List<CV> findByUser(Student student);

    long countByUserAndVisibility(Student student, DocumentVisibility visibility);

    List<CV> findByVisibility(DocumentVisibility visibility);

    Optional<CV> findByIdAndVisibility(long id, DocumentVisibility visibility);

    List<CV> findByUser_Credentials_EmailAndStatusAndVisibility(String email, ReviewStatus status, DocumentVisibility visibility);
}
