package com.lacouf.rsbjwt.service.traduction;

import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.ConnectException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TraductionServiceTest {

    private TraductionService traductionService;

    @Mock
    private HttpClient httpClient;
    @Mock
    private HttpResponse<String> httpResponse;

    private static Internship internship;

    @BeforeEach
    void setUp() {
        traductionService = new TraductionService();
        ReflectionTestUtils.setField(traductionService, "httpClient", httpClient);

        Credentials credentials = Credentials.builder()
                .email("email@example.com")
                .password("Test123@-encoded")
                .role(Role.EMPLOYER)
                .build();
        Employer employer = new Employer("First Name", "Last Name", credentials, "Company Name", Discipline.COMPUTER_SCIENCE, "5141234567");
        employer.setId(1L);

        AcademicSession session = new AcademicSession(Season.WINTER, 2027);
        session.setId(1L);

        internship = new Internship("Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID,
                LocalDate.now().plusMonths(4), LocalDate.now().plusMonths(2), new BigDecimal("25.00"), false, employer, session);
        internship.setId(10L);
    }

    // ---------- needsTranslation ----------

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "12345"})
    void shouldNotNeedTranslationWhenTextHasNoLetters(String text) {
        assertFalse(traductionService.needsTranslation(text));
    }

    @Test
    void shouldNeedTranslationWhenTextHasLetters() {
        assertTrue(traductionService.needsTranslation("Offre 2026"));
    }

    // ---------- traductStringToLanguage ----------

    @Test
    void shouldReturnTranslatedTextWhenLibreTranslateAnswers() throws Exception {
        // Arrange
        mockLibreResponse(200, "{\"translatedText\":\"Candidature refusée\"}");

        // Act
        String result = traductionService.traductStringToLanguage("Application rejected", "fr");

        // Assert
        assertEquals("Candidature refusée", result);
        verify(httpClient).send(any(HttpRequest.class), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"FR", "fr-CA", "fr,en;q=0.9"})
    void shouldNormalizeLanguageBeforeTranslating(String lang) throws Exception {
        // Arrange
        mockLibreResponse(200, "{\"translatedText\":\"Bonjour\"}");

        // Act
        String result = traductionService.traductStringToLanguage("Hello", lang);

        // Assert
        assertEquals("Bonjour", result);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"de"})
    void shouldReturnOriginalTextWithoutCallingLibreWhenLanguageIsNotSupported(String lang) {
        // Act
        String result = traductionService.traductStringToLanguage("Hello", lang);

        // Assert
        assertEquals("Hello", result);
        verifyNoInteractions(httpClient);
    }

    @Test
    void shouldReturnOriginalTextWithoutCallingLibreWhenTextDoesNotNeedTranslation() {
        // Act
        String result = traductionService.traductStringToLanguage("12345", "fr");

        // Assert
        assertEquals("12345", result);
        verifyNoInteractions(httpClient);
    }

    @Test
    void shouldReturnOriginalTextWhenLibreTranslateReturnsAnError() throws Exception {
        // Arrange
        mockLibreResponse(500, "Internal Server Error");

        // Act
        String result = traductionService.traductStringToLanguage("Hello", "fr");

        // Assert
        assertEquals("Hello", result);
    }

    @Test
    void shouldReturnOriginalTextWhenCallFailsUnexpectedly() throws Exception {
        // Arrange
        doThrow(new IOException("boom")).when(httpClient).send(any(HttpRequest.class), any());

        // Act
        String result = traductionService.traductStringToLanguage("Hello", "fr");

        // Assert
        assertEquals("Hello", result);
    }

    // ---------- circuit breaker (unavailable for 30s) ----------

    @Test
    void shouldStopCallingLibreAfterConnectionFailure() throws Exception {
        // Arrange
        doThrow(new ConnectException("refused")).when(httpClient).send(any(HttpRequest.class), any());

        // Act
        String first = traductionService.traductStringToLanguage("Hello", "fr");
        String second = traductionService.traductStringToLanguage("World", "fr");

        // Assert
        assertEquals("Hello", first);
        assertEquals("World", second);
        verify(httpClient, times(1)).send(any(HttpRequest.class), any());
    }

    @Test
    void shouldCallLibreAgainOnceRetryDelayHasPassed() throws Exception {
        // Arrange
        doThrow(new ConnectException("refused")).when(httpClient).send(any(HttpRequest.class), any());

        traductionService.traductStringToLanguage("Hello", "fr");
        ReflectionTestUtils.setField(traductionService, "unavailableUntil", System.currentTimeMillis() - 1);

        // Act
        traductionService.traductStringToLanguage("World", "fr");

        // Assert
        verify(httpClient, times(2)).send(any(HttpRequest.class), any());
    }

    // ---------- translateInternships ----------

    @Test
    void shouldTranslateRejectionCommentOfInternships() throws Exception {
        // Arrange
        InternshipResponseDto original = dtoWithRejectionComment("Missing details");
        mockLibreResponse(200, "{\"translatedText\":\"Détails manquants\"}");

        // Act
        List<InternshipResponseDto> result = traductionService.translateInternships(List.of(original), "fr");

        // Assert
        InternshipResponseDto translated = result.getFirst();
        assertEquals("Détails manquants", translated.rejectionComment());
        assertEquals(original.id(), translated.id());
        assertEquals(original.title(), translated.title());
    }

    @Test
    void shouldNotTranslateInternshipWithoutRejectionComment() {
        // Arrange
        InternshipResponseDto withoutComment = dtoWithRejectionComment(null);

        // Act
        List<InternshipResponseDto> result = traductionService.translateInternships(List.of(withoutComment), "fr");

        // Assert
        assertSame(withoutComment, result.getFirst());
        verifyNoInteractions(httpClient);
    }

    @Test
    void shouldKeepOriginalCommentWhenTranslationFails() throws Exception {
        // Arrange
        mockLibreResponse(500, "Internal Server Error");

        // Act
        List<InternshipResponseDto> result = traductionService.translateInternships(List.of(dtoWithRejectionComment("Missing details")), "fr");

        // Assert
        assertEquals("Missing details", result.getFirst().rejectionComment());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"de"})
    void shouldReturnSameListWhenTargetLanguageIsNotSupported(String lang) {
        // Arrange
        List<InternshipResponseDto> internships = List.of(dtoWithRejectionComment("Missing details"));

        // Act
        List<InternshipResponseDto> result = traductionService.translateInternships(internships, lang);

        // Assert
        assertSame(internships, result);
        verifyNoInteractions(httpClient);
    }

    // ---------- Helpers ----------

    private void mockLibreResponse(int statusCode, String body) throws Exception {
        when(httpResponse.statusCode()).thenReturn(statusCode);
        lenient().when(httpResponse.body()).thenReturn(body);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());
    }

    private static InternshipResponseDto dtoWithRejectionComment(String comment) {
        InternshipResponseDto original = InternshipResponseDto.of(internship);

        return new InternshipResponseDto(
                original.id(), original.title(), original.description(), original.requiredSkills(),
                original.durationInWeeks(), original.location(), original.workMode(), original.startDate(),
                original.applicationDeadline(), original.compensationAmount(), original.compensationNegotiable(),
                original.status(), comment, original.employerId(), original.employerEmail(),
                original.discipline(), original.uploadedAt());
    }
}