package com.lacouf.rsbjwt.repository.session;

import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicSessionRepository extends JpaRepository<AcademicSession, Long> {

    Optional<AcademicSession> findBySeasonAndSessionYear(Season season, int sessionYear);

    List<AcademicSession> findAllByOrderByStartDateDesc();
}
