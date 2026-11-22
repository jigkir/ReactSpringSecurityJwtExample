package com.lacouf.rsbjwt.repository.evaluation.intern;

import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluation;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InternEvaluationRepository extends JpaRepository<InternEvaluation, Long> {
    
    List<InternEvaluation> findByTracking_Internship_PostedBy_Credentials_EmailAndTracking_Internship_Session(String email, AcademicSession session);

    List<InternEvaluation> findByTracking_Internship_PostedBy_Credentials_EmailAndSignedAtIsNull(String email);

    Optional<InternEvaluation> findByIdAndTracking_Internship_PostedBy_Credentials_Email(long id, String email);
}
