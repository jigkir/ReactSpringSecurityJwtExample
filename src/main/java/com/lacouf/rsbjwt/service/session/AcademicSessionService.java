package com.lacouf.rsbjwt.service.session;

import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.repository.session.AcademicSessionRepository;
import com.lacouf.rsbjwt.service.dto.response.session.AcademicSessionResponseDto;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AcademicSessionService {
    private final AcademicSessionRepository academicSessionRepository;

    public AcademicSessionService(AcademicSessionRepository academicSessionRepository) {
        this.academicSessionRepository = academicSessionRepository;
    }

    public AcademicSession getCurrentSession() {
        LocalDate today = LocalDate.now();
        Season season = Season.of(today);
        int year = today.getYear();

        return academicSessionRepository.findBySeasonAndSessionYear(season, year)
                .orElseGet(() -> academicSessionRepository.save(new AcademicSession(season, year)));
    }

    public AcademicSession findSessionOrCurrent(Long sessionId) throws AcademicSessionNotFoundException {
        if (sessionId == null) {
            return getCurrentSession();
        }

        return academicSessionRepository.findById(sessionId).orElseThrow(() -> new AcademicSessionNotFoundException(sessionId));
    }

    public boolean isCurrent(AcademicSession session) {
        return isSameSession(session, getCurrentSession());
    }

    public List<AcademicSessionResponseDto> getSessions() {
        AcademicSession currentSession = getCurrentSession();

        return academicSessionRepository.findAllByOrderByStartDateDesc().stream()
                .map(session -> AcademicSessionResponseDto.of(session, isSameSession(session, currentSession)))
                .toList();
    }

    private boolean isSameSession(AcademicSession session, AcademicSession otherSession) {
        if (session == null) {
            return false;
        }
        
        Long sessionId = session.getId();
        Long otherSessionId = otherSession.getId();

        return sessionId.equals(otherSessionId);
    }
}
