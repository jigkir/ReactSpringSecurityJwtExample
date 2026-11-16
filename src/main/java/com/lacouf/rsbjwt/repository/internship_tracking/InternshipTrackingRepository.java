package com.lacouf.rsbjwt.repository.internship_tracking;

import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface InternshipTrackingRepository extends JpaRepository<InternshipTracking, Long> {
    long countByTeacherId(long teacherId);
}
