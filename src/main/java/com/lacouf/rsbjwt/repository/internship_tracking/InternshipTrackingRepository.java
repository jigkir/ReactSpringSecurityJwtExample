package com.lacouf.rsbjwt.repository.internship_tracking;

import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;


@Repository
public interface InternshipTrackingRepository extends JpaRepository<InternshipTracking, Long> {

    @Query("SELECT t.teacher.id AS teacherId, COUNT(t) AS total FROM InternshipTracking t WHERE t.teacher.id IN :teacherIds GROUP BY t.teacher.id")
    List<TeacherStudentCount> countByTeacherIds(@Param("teacherIds") Collection<Long> teacherIds);
}
