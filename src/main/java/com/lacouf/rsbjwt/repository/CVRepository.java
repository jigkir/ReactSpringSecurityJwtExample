package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.cv.CVSharingScope;
import com.lacouf.rsbjwt.model.cv.CvPriority;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface CVRepository extends JpaRepository<CV, Long> {
    long countByStudent(Student student);

    List<CV> findByStudent(Student student);

    CV findByStudentAndPriority(Student student, CvPriority priority);

    Optional<CV> findByIdAndSharingScope(long id, CVSharingScope sharingScope);

    List<CV> findBySharingScope(CVSharingScope sharingScope);

    long countByStudentAndVisibility(Student student, CvVisibility visibility);

    List<CV> findBySharingScopeAndVisibility(CVSharingScope sharingScope, CvVisibility visibility);

    Optional<CV> findByIdAndSharingScopeAndVisibility(long id, CVSharingScope sharingScope, CvVisibility visibility);
}
