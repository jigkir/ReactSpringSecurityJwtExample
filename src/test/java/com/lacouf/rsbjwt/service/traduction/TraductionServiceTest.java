package com.lacouf.rsbjwt.service.traduction;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class TraductionServiceTest {

    private TraductionService traductionService;

    @Mock
    private LibreTranslateClient client;

    @BeforeEach
    void createTraductionService() {
        traductionService = new TraductionService(client);
    }

    @Test
    void shouldTranslateTextWithGivenSourceAndTarget() {
        // Arrange
        when(client.translate(new LibreTranslateClient.LibreRequest("Bonjour", "fr", "en", "text")))
                .thenReturn(new LibreTranslateClient.LibreResponse("Hello"));

        // Act
        Optional<String> result = traductionService.translate("Bonjour", "fr", "en");

        // Assert
        assert (Optional.of("Hello")).equals(result);
    }

    @Test
    void shouldNotCallLibreTranslateWhenSourceAndTargetAreTheSame() {
        // Act
        Optional<String> result = traductionService.translate("Bonjour", "fr", "fr");

        // Assert
        assert (Optional.of("Bonjour")).equals(result);

        verifyNoInteractions(client);
    }

    @Test
    void shouldNotCallLibreTranslateWhenTextIsNull() {
        // Act
        Optional<String> result = traductionService.translate(null, "fr", "en");

        // Assert
        assert (Optional.of("")).equals(result);

        verifyNoInteractions(client);
    }

    @Test
    void shouldNotCallLibreTranslateWhenTextIsBlank() {
        // Act
        Optional<String> result = traductionService.translate("   ", "fr", "en");

        // Assert
        assert (Optional.of("   ")).equals(result);

        verifyNoInteractions(client);
    }

    @Test
    void shouldNotCallLibreTranslateWhenTextHasNoLetters() {
        // Act
        Optional<String> result = traductionService.translate("12345", "fr", "en");

        // Assert
        assert (Optional.of("12345")).equals(result);

        verifyNoInteractions(client);
    }

    @Test
    void shouldReturnEmptyWhenLibreTranslateIsUnreachable() {
        // Arrange
        when(client.translate(any())).thenThrow(new ResourceAccessException("connection refused"));

        // Act
        Optional<String> result = traductionService.translate("Bonjour", "fr", "en");

        // Assert
        assert result.isEmpty();
    }

    @Test
    void shouldDetectLanguage() {
        // Arrange
        when(client.detect(new LibreTranslateClient.DetectRequest("Bonjour tout le monde")))
                .thenReturn(List.of(new LibreTranslateClient.DetectResult(90, "fr")));

        // Act
        Optional<String> result = traductionService.detectLanguage("Bonjour tout le monde");

        // Assert
        assert (Optional.of("fr")).equals(result);
    }

    @Test
    void shouldNotCallLibreTranslateWhenDetectingLanguageOfBlankText() {
        // Act
        Optional<String> nullResult = traductionService.detectLanguage(null);
        Optional<String> blankResult = traductionService.detectLanguage("  ");

        // Assert
        assert nullResult.isEmpty();
        assert blankResult.isEmpty();

        verifyNoInteractions(client);
    }

    @Test
    void shouldReturnEmptyWhenDetectedLanguageIsNotSupported() {
        // Arrange
        when(client.detect(any())).thenReturn(List.of(new LibreTranslateClient.DetectResult(90, "es")));

        // Act
        Optional<String> result = traductionService.detectLanguage("Hola");

        // Assert
        assert result.isEmpty();
    }

    @Test
    void shouldReturnEmptyWhenDetectionFails() {
        // Arrange
        when(client.detect(any())).thenThrow(new ResourceAccessException("connection refused"));

        // Act
        Optional<String> result = traductionService.detectLanguage("Bonjour");

        // Assert
        assert result.isEmpty();
    }

    @ParameterizedTest
    @CsvSource(value = {"fr-CA,fr", "en_US,en", "EN,en", "'fr,en;q=0.8',fr", "es,", "' ',"})
    void shouldNormalizeLanguage(String input, String expected) {
        // Act
        String result = TraductionService.normalizeLang(input);

        // Assert
        assert Objects.equals(expected, result);
    }

    @Test
    void shouldReturnNullWhenNormalizingNullLanguage() {
        // Act
        String result = TraductionService.normalizeLang(null);

        // Assert
        assert (result == null);
    }
}