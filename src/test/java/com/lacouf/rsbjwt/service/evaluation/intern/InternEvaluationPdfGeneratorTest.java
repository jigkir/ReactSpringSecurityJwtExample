package com.lacouf.rsbjwt.service.evaluation.intern;

import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluation;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationTestData.*;
import static com.lacouf.rsbjwt.service.pdf.PdfTestSupport.messageSource;
import static com.lacouf.rsbjwt.service.pdf.PdfTestSupport.textOf;

public class InternEvaluationPdfGeneratorTest {

    private final InternEvaluationPdfGenerator internEvaluationPdfGenerator = new InternEvaluationPdfGenerator(messageSource());

    @Test
    void shouldWriteIdentificationSectionsAndAppreciationWhenGeneratingEvaluation() throws IOException {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();

        // Act
        String text = textOf(internEvaluationPdfGenerator.generate(evaluation, DocumentLanguage.FR));

        // Assert
        assert text.contains("FICHE");
        assert text.contains("Session H2027");
        assert text.contains("Léa Tremblay");
        assert text.contains("Informatique");
        assert text.contains("Tech Corp");
        assert text.contains("Jean Dupont");
        assert text.contains("Développeur principal");
        assert text.contains("1. PRODUCTIVITÉ");
        assert text.contains("4. HABILETÉS PERSONNELLES");
        assert text.contains("Le stagiaire a été en mesure de :");
        assert text.contains("Teste maintenant son code");
        assert text.contains("Les habiletés démontrées dépassent les attentes");
        assert text.contains("7,5");
        assert text.contains("En attente de signature");
    }

    @Test
    void shouldWriteNotAnsweredWhenEvaluationIsEmpty() throws IOException {
        // Act
        String text = textOf(internEvaluationPdfGenerator.generate(internEvaluation(), DocumentLanguage.FR));

        // Assert
        assert text.contains("Non répondu");
    }

    @Test
    void shouldShowSigningTimeWhenEvaluationIsSigned() throws IOException {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();
        evaluation.sign(NOW);

        // Act
        String text = textOf(internEvaluationPdfGenerator.generate(evaluation, DocumentLanguage.FR));

        // Assert
        assert text.contains("Signé le 20 novembre 2026 à 14:30");
    }

    @Test
    void shouldWriteEvaluationInEnglishWhenUserChoosesEnglish() throws IOException {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();

        // Act
        String text = textOf(internEvaluationPdfGenerator.generate(evaluation, DocumentLanguage.EN));

        // Assert
        assert text.contains("INTERN");
        assert text.contains("Computer science");
        assert text.contains("1. PRODUCTIVITY");
        assert text.contains("The intern was able to:");
        assert text.contains("The skills shown exceed expectations");
        assert text.contains("Pending signature");
    }
}
