package com.lacouf.rsbjwt.repository.evaluation.workplace;

import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkplaceEvaluationRepository extends JpaRepository<WorkplaceEvaluation, Long> {

    List<WorkplaceEvaluation> findByTracking_Teacher_Credentials_EmailAndTracking_Internship_Session(String email, AcademicSession session);

    List<WorkplaceEvaluation> findByTracking_Teacher_Credentials_EmailAndSignedAtIsNull(String email);

    Optional<WorkplaceEvaluation> findByIdAndTracking_Teacher_Credentials_Email(long id, String email);
}
