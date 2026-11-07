package com.lacouf.rsbjwt.service.session;

import com.lacouf.rsbjwt.exception.internship.StartDateOutsideInternshipSeasonException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.repository.session.AcademicSessionRepository;
import com.lacouf.rsbjwt.service.dto.response.session.AcademicSessionResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AcademicSessionServiceTest {
    private static final LocalDate FALL_DAY = LocalDate.of(2026, 11, 7);
    private static final int TARGET_YEAR = 2027;

    private AcademicSessionService academicSessionService;

    @Mock
    private AcademicSessionRepository academicSessionRepository;

    @Captor
    private ArgumentCaptor<AcademicSession> sessionArgumentCaptor;

    private AcademicSession targetSession;

    @BeforeEach
    void setUp() {
        academicSessionService = createServiceOn(FALL_DAY);

        targetSession = new AcademicSession(Season.WINTER, TARGET_YEAR);
        targetSession.setId(1L);
    }

    @Test
    void shouldReturnTargetSessionWithoutSavingWhenItAlreadyExists() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));

        // Act
        AcademicSession session = academicSessionService.getTargetSession();

        // Assert
        assert (targetSession).equals(session);

        verify(academicSessionRepository, never()).save(any(AcademicSession.class));
    }

    @Test
    void shouldCreateNextWinterSessionWhenThisYearWinterIsOver() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.empty());
        when(academicSessionRepository.save(any(AcademicSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        academicSessionService.getTargetSession();

        // Assert
        verify(academicSessionRepository).save(sessionArgumentCaptor.capture());

        AcademicSession createdSession = sessionArgumentCaptor.getValue();

        assert ("H2027").equals(createdSession.getName());
        assert (LocalDate.of(2027, 1, 1)).equals(createdSession.getStartDate());
        assert (LocalDate.of(2027, 5, 31)).equals(createdSession.getEndDate());
    }

    @Test
    void shouldTargetWinterInProgressWhenItIsNotOverYet() {
        // Arrange
        AcademicSessionService serviceDuringWinter = createServiceOn(LocalDate.of(2027, 5, 31));

        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));

        // Act
        AcademicSession session = serviceDuringWinter.getTargetSession();

        // Assert
        assert (targetSession).equals(session);
    }

    @Test
    void shouldCreateSessionContainingDateWhenItDoesNotExistYet() throws StartDateOutsideInternshipSeasonException {
        // Arrange
        LocalDate startDate = LocalDate.of(2027, 1, 18);

        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, 2027)).thenReturn(Optional.empty());
        when(academicSessionRepository.save(any(AcademicSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        AcademicSession session = academicSessionService.getSessionContaining(startDate);

        // Assert
        assert ("H2027").equals(session.getName());
    }

    @Test
    void shouldThrowStartDateOutsideInternshipSeasonWhenStartDateIsNotInWinter() {
        // Arrange
        LocalDate summerDate = LocalDate.of(2027, 6, 1);

        // Act + Assert
        assertThrows(StartDateOutsideInternshipSeasonException.class, () -> academicSessionService.getSessionContaining(summerDate));

        verify(academicSessionRepository, never()).save(any(AcademicSession.class));
    }

    @Test
    void shouldReturnTargetSessionWhenNoSessionIsChosen() throws AcademicSessionNotFoundException {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));

        // Act
        AcademicSession session = academicSessionService.findSessionOrCurrent(null);

        // Assert
        assert (targetSession).equals(session);
    }

    @Test
    void shouldReturnChosenSessionWhenSessionExists() throws AcademicSessionNotFoundException {
        // Arrange
        AcademicSession pastSession = pastSession();

        when(academicSessionRepository.findById(2L)).thenReturn(Optional.of(pastSession));

        // Act
        AcademicSession session = academicSessionService.findSessionOrCurrent(2L);

        // Assert
        assert (pastSession).equals(session);
    }

    @Test
    void shouldThrowAcademicSessionNotFoundWhenChosenSessionIsUnknown() {
        // Arrange
        when(academicSessionRepository.findById(99L)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(AcademicSessionNotFoundException.class, () -> academicSessionService.findSessionOrCurrent(99L));
    }

    @Test
    void shouldBeTargetSessionWhenSessionIsTheTargetOne() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));

        // Act + Assert
        assert academicSessionService.isTargetSession(targetSession);
    }

    @Test
    void shouldNotBeTargetSessionWhenSessionIsPast() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));

        // Act + Assert
        assert !academicSessionService.isTargetSession(pastSession());
    }

    @Test
    void shouldNotBeTargetSessionWhenStudentHasNoSessionYet() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));

        // Act + Assert
        assert !academicSessionService.isTargetSession(null);
    }

    @Test
    void shouldFlagOnlyTargetSessionWhenListingSessions() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));
        when(academicSessionRepository.findAllByOrderByStartDateDesc()).thenReturn(List.of(targetSession, pastSession()));

        // Act
        List<AcademicSessionResponseDto> sessions = academicSessionService.getSessions();

        // Assert
        assert (Integer.valueOf(2)).equals(sessions.size());
        assert sessions.getFirst().target();
        assert ("H2027").equals(sessions.getFirst().name());
        assert !sessions.get(1).target();
        assert ("H2026").equals(sessions.get(1).name());
    }

    @Test
    void shouldReturnTargetAndUpcomingSessionsWhenNoSessionIsChosen() throws AcademicSessionNotFoundException {
        // Arrange
        AcademicSession upcomingSession = upcomingSession();

        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));
        when(academicSessionRepository.findByStartDateGreaterThanEqual(targetSession.getStartDate())).thenReturn(List.of(targetSession, upcomingSession));

        // Act
        List<AcademicSession> sessions = academicSessionService.findSessionOrCurrentAndUpcoming(null);

        // Assert
        assert (List.of(targetSession, upcomingSession)).equals(sessions);
    }

    @Test
    void shouldReturnOnlyChosenSessionWhenItIsNotTheTargetOne() throws AcademicSessionNotFoundException {
        // Arrange
        AcademicSession pastSession = pastSession();

        when(academicSessionRepository.findBySeasonAndSessionYear(Season.WINTER, TARGET_YEAR)).thenReturn(Optional.of(targetSession));
        when(academicSessionRepository.findById(2L)).thenReturn(Optional.of(pastSession));

        // Act
        List<AcademicSession> sessions = academicSessionService.findSessionOrCurrentAndUpcoming(2L);

        // Assert
        assert (List.of(pastSession)).equals(sessions);

        verify(academicSessionRepository, never()).findByStartDateGreaterThanEqual(any(LocalDate.class));
    }

    // ---------- Helpers ----------

    private AcademicSessionService createServiceOn(LocalDate today) {
        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime startOfToday = today.atStartOfDay(zone);
        Clock clock = Clock.fixed(startOfToday.toInstant(), zone);

        return new AcademicSessionService(academicSessionRepository, clock);
    }

    private static AcademicSession pastSession() {
        AcademicSession pastSession = new AcademicSession(Season.WINTER, 2026);
        pastSession.setId(2L);

        return pastSession;
    }

    private static AcademicSession upcomingSession() {
        AcademicSession upcomingSession = new AcademicSession(Season.WINTER, 2028);
        upcomingSession.setId(3L);

        return upcomingSession;
    }
}