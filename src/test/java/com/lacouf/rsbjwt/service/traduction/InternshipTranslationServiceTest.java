package com.lacouf.rsbjwt.service.traduction;

import com.lacouf.rsbjwt.model.TranslationStatus;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.repository.internship.InternshipRepository;
import com.lacouf.rsbjwt.service.traduction.Internship.InternshipChangedEvent;
import com.lacouf.rsbjwt.service.traduction.Internship.InternshipTranslationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InternshipTranslationServiceTest {

    private InternshipTranslationService internshipTranslationService;

    @Mock
    private TraductionService traductionService;
    @Mock
    private InternshipRepository internshipRepository;

    @BeforeEach
    void createInternshipTranslationService() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(mock(PlatformTransactionManager.class));

        internshipTranslationService = new InternshipTranslationService(traductionService, internshipRepository, transactionTemplate);
    }

    @Test
    void shouldSaveTranslationsInBothLanguagesAndMarkAsDone() {
        // Arrange
        Internship internship = internshipWithId(1L);

        when(traductionService.detectLanguage(any())).thenReturn(Optional.of("fr"));
        when(traductionService.translate("Intégrateur web", "fr", "fr")).thenReturn(Optional.of("Intégrateur web"));
        when(traductionService.translate("Intégrateur web", "fr", "en")).thenReturn(Optional.of("Web integrator"));
        when(traductionService.translate("Description", "fr", "fr")).thenReturn(Optional.of("Description"));
        when(traductionService.translate("Description", "fr", "en")).thenReturn(Optional.of("Description EN"));
        when(traductionService.translate("Trop vague", "fr", "fr")).thenReturn(Optional.of("Trop vague"));
        when(traductionService.translate("Trop vague", "fr", "en")).thenReturn(Optional.of("Too vague"));
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship));

        // Act
        boolean saved = internshipTranslationService.translateAndSave(event("Trop vague"));

        // Assert
        assert saved;
        assert ("Intégrateur web").equals(internship.getTranslation("fr").orElseThrow().getTitle());
        assert ("Web integrator").equals(internship.getTranslation("en").orElseThrow().getTitle());
        assert ("Description EN").equals(internship.getTranslation("en").orElseThrow().getDescription());
        assert ("Too vague").equals(internship.getTranslation("en").orElseThrow().getRejectionComment());
        assert (TranslationStatus.DONE).equals(internship.getTranslationStatus());
    }

    @Test
    void shouldStoreNullRejectionCommentWhenInternshipWasNotRejected() {
        // Arrange
        Internship internship = internshipWithId(1L);

        when(traductionService.detectLanguage(any())).thenReturn(Optional.of("fr"));
        when(traductionService.translate(eq("Intégrateur web"), eq("fr"), anyString())).thenReturn(Optional.of("Title"));
        when(traductionService.translate(eq("Description"), eq("fr"), anyString())).thenReturn(Optional.of("Description"));
        when(traductionService.translate(isNull(), eq("fr"), anyString())).thenReturn(Optional.of(""));
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(internship));

        // Act
        internshipTranslationService.translateAndSave(event(null));

        // Assert
        assert (internship.getTranslation("en").orElseThrow().getRejectionComment() == null);
        assert (internship.getTranslation("fr").orElseThrow().getRejectionComment() == null);
    }

    @Test
    void shouldDetectLanguageOnceFromTitleAndDescription() {
        // Arrange
        when(traductionService.detectLanguage("Intégrateur web. Description")).thenReturn(Optional.empty());

        // Act
        internshipTranslationService.translateAndSave(event(null));

        // Assert
        verify(traductionService, times(1)).detectLanguage("Intégrateur web. Description");
    }

    @Test
    void shouldSaveNothingWhenLanguageDetectionFails() {
        // Arrange
        when(traductionService.detectLanguage(any())).thenReturn(Optional.empty());

        // Act
        boolean saved = internshipTranslationService.translateAndSave(event("Trop vague"));

        // Assert
        assert !saved;

        verify(traductionService, never()).translate(any(), any(), any());
        verifyNoInteractions(internshipRepository);
    }

    @Test
    void shouldSaveNothingWhenATranslationFails() {
        // Arrange
        when(traductionService.detectLanguage(any())).thenReturn(Optional.of("fr"));
        when(traductionService.translate(any(), eq("fr"), anyString())).thenReturn(Optional.empty());

        // Act
        boolean saved = internshipTranslationService.translateAndSave(event("Trop vague"));

        // Assert
        assert !saved;

        verifyNoInteractions(internshipRepository);
    }

    @Test
    void shouldRetryEveryPendingInternship() {
        // Arrange
        Internship first = internshipWithId(1L);
        Internship second = internshipWithId(2L);

        when(internshipRepository.findByTranslationStatusAndDeletedFalse(TranslationStatus.PENDING)).thenReturn(List.of(first, second));
        when(traductionService.detectLanguage(any())).thenReturn(Optional.of("fr"));
        when(traductionService.translate(any(), eq("fr"), anyString())).thenReturn(Optional.of("translated"));
        when(internshipRepository.findById(1L)).thenReturn(Optional.of(first));
        when(internshipRepository.findById(2L)).thenReturn(Optional.of(second));

        // Act
        internshipTranslationService.retryPending();

        // Assert
        assert (TranslationStatus.DONE).equals(first.getTranslationStatus());
        assert (TranslationStatus.DONE).equals(second.getTranslationStatus());
    }

    @Test
    void shouldStopRetryingAtFirstFailureWhenLibreTranslateIsDown() {
        // Arrange
        when(internshipRepository.findByTranslationStatusAndDeletedFalse(TranslationStatus.PENDING))
                .thenReturn(List.of(internshipWithId(1L), internshipWithId(2L)));
        when(traductionService.detectLanguage(any())).thenReturn(Optional.empty());

        // Act
        internshipTranslationService.retryPending();

        // Assert: the second internship is not attempted
        verify(traductionService, times(1)).detectLanguage(any());
    }

    // ---------- Helpers ----------

    private static Internship internshipWithId(long id) {
        Internship internship = new Internship();
        internship.setId(id);

        return internship;
    }

    private static InternshipChangedEvent event(String rejectionComment) {
        return new InternshipChangedEvent(1L, "Intégrateur web", "Description", rejectionComment);
    }
}
