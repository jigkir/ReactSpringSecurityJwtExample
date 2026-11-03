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
        return getSessionContaining(LocalDate.now());
    }

    public AcademicSession getSessionContaining(LocalDate date) {
        Season season = Season.of(date);
        int year = date.getYear();

        return academicSessionRepository.findBySeasonAndSessionYear(season, year)
                .orElseGet(() -> academicSessionRepository.save(new AcademicSession(season, year)));
    }

    public AcademicSession findSessionOrCurrent(Long sessionId) throws AcademicSessionNotFoundException {
        if (sessionId == null) {
            return getCurrentSession();
        }

        return academicSessionRepository.findById(sessionId).orElseThrow(() -> new AcademicSessionNotFoundException(sessionId));
    }

    public boolean isInCurrentAcademicYear(AcademicSession session) {
        if (session == null) {
            return false;
        }

        return session.getAcademicYear() == getCurrentSession().getAcademicYear();
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
