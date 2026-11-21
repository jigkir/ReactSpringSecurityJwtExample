package com.lacouf.rsbjwt.service.traduction;

import com.lacouf.rsbjwt.model.TranslationStatus;
import com.lacouf.rsbjwt.model.document.DocumentVisibility;
import com.lacouf.rsbjwt.model.document.student.cv.CV;
import com.lacouf.rsbjwt.repository.document.student.cv.CVRepository;
import com.lacouf.rsbjwt.service.traduction.cv.CVChangedEvent;
import com.lacouf.rsbjwt.service.traduction.cv.CVTranslationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CVTranslationServiceTest {

    private CVTranslationService cvTranslationService;

    @Mock
    private TraductionService traductionService;
    @Mock
    private CVRepository cvRepository;

    @BeforeEach
    void createCVTranslationService() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(mock(PlatformTransactionManager.class));

        cvTranslationService = new CVTranslationService(traductionService, cvRepository, transactionTemplate);
    }

    @Test
    void shouldMarkAsDoneWithoutCallingLibreTranslateWhenCvWasNotRejected() {
        // Arrange
        CV cv = new CV();
        cv.setId(5L);

        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));

        // Act
        boolean saved = cvTranslationService.translateAndSave(new CVChangedEvent(5L, null));

        // Assert
        assert saved;
        assert (TranslationStatus.DONE).equals(cv.getTranslationStatus());

        verifyNoInteractions(traductionService);
    }

    @Test
    void shouldTranslateRejectionMessageInBothLanguages() {
        // Arrange
        CV cv = new CV();
        cv.setId(5L);

        when(traductionService.detectLanguage("Trop court")).thenReturn(Optional.of("fr"));
        when(traductionService.translate("Trop court", "fr", "fr")).thenReturn(Optional.of("Trop court"));
        when(traductionService.translate("Trop court", "fr", "en")).thenReturn(Optional.of("Too short"));
        when(cvRepository.findById(5L)).thenReturn(Optional.of(cv));

        // Act
        boolean saved = cvTranslationService.translateAndSave(new CVChangedEvent(5L, "Trop court"));

        // Assert
        assert saved;
        assert ("Too short").equals(cv.getTranslation("en").orElseThrow().getRejectionComment());
        assert (TranslationStatus.DONE).equals(cv.getTranslationStatus());
    }

    @Test
    void shouldSaveNothingWhenLanguageDetectionFails() {
        // Arrange
        when(traductionService.detectLanguage("Trop court")).thenReturn(Optional.empty());

        // Act
        boolean saved = cvTranslationService.translateAndSave(new CVChangedEvent(5L, "Trop court"));

        // Assert
        assert !saved;

        verifyNoInteractions(cvRepository);
    }

    @Test
    void shouldStopRetryingAtFirstFailureWhenLibreTranslateIsDown() {
        // Arrange
        CV first = new CV();
        first.setId(5L);
        first.setRejectionComment("Trop court");
        CV second = new CV();
        second.setId(6L);
        second.setRejectionComment("Trop court");

        when(cvRepository.findByTranslationStatusAndVisibility(TranslationStatus.PENDING, DocumentVisibility.VISIBLE))
                .thenReturn(List.of(first, second));
        when(traductionService.detectLanguage(any())).thenReturn(Optional.empty());

        // Act
        cvTranslationService.retryPending();

        // Assert
        verify(traductionService, times(1)).detectLanguage(any());
    }
}
