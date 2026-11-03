package com.lacouf.rsbjwt.service.session;

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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AcademicSessionServiceTest {

    @InjectMocks
    private AcademicSessionService academicSessionService;

    @Mock
    private AcademicSessionRepository academicSessionRepository;

    @Captor
    private ArgumentCaptor<AcademicSession> sessionArgumentCaptor;

    private Season currentSeason;
    private int currentYear;
    private AcademicSession currentSession;

    @BeforeEach
    void setUp() {
        LocalDate today = LocalDate.now();
        currentSeason = Season.of(today);
        currentYear = today.getYear();

        currentSession = new AcademicSession(currentSeason, currentYear);
        currentSession.setId(1L);
    }

    @Test
    void shouldReturnCurrentSessionWithoutSavingWhenItAlreadyExists() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(currentSeason, currentYear)).thenReturn(Optional.of(currentSession));

        // Act
        AcademicSession session = academicSessionService.getCurrentSession();

        // Assert
        assert (currentSession).equals(session);

        verify(academicSessionRepository, never()).save(any(AcademicSession.class));
    }

    @Test
    void shouldCreateSessionContainingDateWhenItDoesNotExistYet() {
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
    void shouldCreateCurrentSessionWhenItDoesNotExistYet() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(currentSeason, currentYear)).thenReturn(Optional.empty());
        when(academicSessionRepository.save(any(AcademicSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        academicSessionService.getCurrentSession();

        // Assert
        verify(academicSessionRepository).save(sessionArgumentCaptor.capture());

        AcademicSession createdSession = sessionArgumentCaptor.getValue();

        assert (currentSeason).equals(createdSession.getSeason());
        assert (currentSeason.firstDayIn(currentYear)).equals(createdSession.getStartDate());
        assert (currentSeason.lastDayIn(currentYear)).equals(createdSession.getEndDate());
        assert !createdSession.getStartDate().isAfter(LocalDate.now());
        assert !createdSession.getEndDate().isBefore(LocalDate.now());
    }

    @Test
    void shouldReturnCurrentSessionWhenNoSessionIsChosen() throws AcademicSessionNotFoundException {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(currentSeason, currentYear)).thenReturn(Optional.of(currentSession));

        // Act
        AcademicSession session = academicSessionService.findSessionOrCurrent(null);

        // Assert
        assert (currentSession).equals(session);
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
    void shouldBeInCurrentAcademicYearWhenSessionIsTheCurrentOne() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(currentSeason, currentYear)).thenReturn(Optional.of(currentSession));

        // Act + Assert
        assert academicSessionService.isInCurrentAcademicYear(currentSession);
    }

    @Test
    void shouldBeInCurrentAcademicYearWhenSessionIsTheFallThatStartedIt() {
        // Arrange
        AcademicSession fallSession = new AcademicSession(Season.FALL, currentSession.getAcademicYear());

        when(academicSessionRepository.findBySeasonAndSessionYear(currentSeason, currentYear)).thenReturn(Optional.of(currentSession));

        // Act + Assert
        assert academicSessionService.isInCurrentAcademicYear(fallSession);
    }

    @Test
    void shouldNotBeInCurrentAcademicYearWhenSessionIsTheSummerBeforeIt() {
        // Arrange
        AcademicSession summerSession = new AcademicSession(Season.SUMMER, currentSession.getAcademicYear());

        when(academicSessionRepository.findBySeasonAndSessionYear(currentSeason, currentYear)).thenReturn(Optional.of(currentSession));

        // Act + Assert
        assert !academicSessionService.isInCurrentAcademicYear(summerSession);
    }

    @Test
    void shouldNotBeInCurrentAcademicYearWhenSessionIsPast() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(currentSeason, currentYear)).thenReturn(Optional.of(currentSession));

        // Act + Assert
        assert !academicSessionService.isInCurrentAcademicYear(pastSession());
    }

    @Test
    void shouldNotBeInCurrentAcademicYearWhenStudentHasNoSessionYet() {
        // Act + Assert
        assert !academicSessionService.isInCurrentAcademicYear(null);
    }

    @Test
    void shouldFlagOnlyCurrentSessionWhenListingSessions() {
        // Arrange
        when(academicSessionRepository.findBySeasonAndSessionYear(currentSeason, currentYear)).thenReturn(Optional.of(currentSession));
        when(academicSessionRepository.findAllByOrderByStartDateDesc()).thenReturn(List.of(currentSession, pastSession()));

        // Act
        List<AcademicSessionResponseDto> sessions = academicSessionService.getSessions();

        // Assert
        assert (Integer.valueOf(2)).equals(sessions.size());
        assert sessions.getFirst().current();
        assert (currentSeason.getCode() + currentYear).equals(sessions.getFirst().name());
        assert !sessions.get(1).current();
        assert ("H2020").equals(sessions.get(1).name());
    }

    // ---------- Helpers ----------

    private static AcademicSession pastSession() {
        AcademicSession pastSession = new AcademicSession(Season.WINTER, 2020);
        pastSession.setId(2L);

        return pastSession;
    }
}