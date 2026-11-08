package com.lacouf.rsbjwt.service.session;

import com.lacouf.rsbjwt.exception.internship.InternshipStartDateOutsideTargetSessionException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.repository.session.AcademicSessionRepository;
import com.lacouf.rsbjwt.service.dto.response.session.AcademicSessionResponseDto;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.Month;
import java.time.MonthDay;
import java.util.List;

@Service
public class AcademicSessionService {
    private static final Season INTERNSHIP_SEASON = Season.WINTER;
    private static final MonthDay ACCESS_RENEWAL_DAY = MonthDay.of(Month.AUGUST, 15);

    private final AcademicSessionRepository academicSessionRepository;
    private final Clock clock;

    public AcademicSessionService(AcademicSessionRepository academicSessionRepository, Clock clock) {
        this.academicSessionRepository = academicSessionRepository;
        this.clock = clock;
    }

    public AcademicSession getTargetSession() {
        LocalDate today = LocalDate.now(clock);
        int year = today.getYear();
        boolean isThisYearSessionOver = today.isAfter(INTERNSHIP_SEASON.lastDayIn(year));

        return getOrCreateSession(isThisYearSessionOver ? year + 1 : year);
    }

    public AcademicSession getAccessSession() {
        LocalDate today = LocalDate.now(clock);
        boolean isNextWinterAccess = !MonthDay.from(today).isBefore(ACCESS_RENEWAL_DAY);

        return getOrCreateSession(isNextWinterAccess ? today.getYear() + 1 : today.getYear());
    }

    public AcademicSession getTargetSessionContaining(LocalDate startDate) throws InternshipStartDateOutsideTargetSessionException {
        AcademicSession targetSession = getTargetSession();

        if (!targetSession.contains(startDate)) {
            throw new InternshipStartDateOutsideTargetSessionException(targetSession);
        }

        return targetSession;
    }

    public AcademicSession findSessionOrCurrent(Long sessionId) throws AcademicSessionNotFoundException {
        if (sessionId == null) {
            return getTargetSession();
        }

        return academicSessionRepository.findById(sessionId).orElseThrow(() -> new AcademicSessionNotFoundException(sessionId));
    }

    public boolean isAccessSession(AcademicSession session) {
        return isSameSession(session, getAccessSession());
    }

    public List<AcademicSessionResponseDto> getSessions() {
        AcademicSession targetSession = getTargetSession();

        return academicSessionRepository.findAllByOrderByStartDateDesc().stream()
                .map(session -> AcademicSessionResponseDto.of(session, isSameSession(session, targetSession)))
                .toList();
    }

    private AcademicSession getOrCreateSession(int year) {
        return academicSessionRepository.findBySeasonAndSessionYear(INTERNSHIP_SEASON, year)
                .orElseGet(() -> academicSessionRepository.save(new AcademicSession(INTERNSHIP_SEASON, year)));
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
