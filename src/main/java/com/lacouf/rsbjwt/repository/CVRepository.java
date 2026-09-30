package com.lacouf.rsbjwt.repository;

import com.lacouf.rsbjwt.model.cv.CV;
import com.lacouf.rsbjwt.model.cv.CVSharingScope;
import com.lacouf.rsbjwt.model.cv.CvPriority;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.model.user.Student;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


@Repository
public interface CVRepository extends JpaRepository<CV, Long> {
    long countByStudent(Student student);

    List<CV> findByStudent(Student student);

    CV findByStudentAndPriority(Student student, CvPriority priority);

    List<CV> findByStatusAndSharingScope(CvStatus cvStatus, CVSharingScope sharingScope);

    Optional<CV> findByIdAndSharingScope(long id, CVSharingScope sharingScope);

    List<CV> findBySharingScope(CVSharingScope sharingScope);
}
