package com.lacouf.rsbjwt.service.evaluation.workplace;

import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.workplace.ShiftRange;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceCriterion;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.LocalTime;
import java.util.List;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationTestData.*;
import static com.lacouf.rsbjwt.service.pdf.PdfTestSupport.messageSource;
import static com.lacouf.rsbjwt.service.pdf.PdfTestSupport.textOf;

public class WorkplaceEvaluationPdfGeneratorTest {

    private final WorkplaceEvaluationPdfGenerator workplaceEvaluationPdfGenerator = new WorkplaceEvaluationPdfGenerator(messageSource());

    @Test
    void shouldWriteCompanyInternAndAnswersWhenGeneratingEvaluation() throws IOException {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();

        // Act
        String text = textOf(workplaceEvaluationPdfGenerator.generate(evaluation, DocumentLanguage.FR));

        // Assert
        assert text.contains("ÉVALUATION");
        assert text.contains("Session H2027");
        assert text.contains("Tech Corp");
        assert text.contains("Jean Dupont");
        assert text.contains("jean@techcorp.com");
        assert text.contains("Léa Tremblay");
        assert text.contains("Du 11 janvier 2027 au 2 mai 2027");
        assert text.contains("Le climat de travail");
        assert text.contains("7,5");
        assert text.contains("22,50");
        assert text.contains("Premier stage");
        assert text.contains("Deux stagiaires");
        assert text.contains("Marie Dubois");
        assert text.contains("En attente de signature");
    }

    @Test
    void shouldWriteShiftRangesWhenShiftsAreVariable() throws IOException {
        // Arrange
        WorkplaceEvaluation evaluation = workplaceEvaluation();
        answerWorkplaceEvaluation(evaluation, ratingsOf(WorkplaceCriterion.class, AgreementLevel.TOTALLY_AGREE), HOURLY_SALARY, null, true,
                List.of(new ShiftRange(LocalTime.of(8, 0), LocalTime.of(16, 0))));

        // Act
        String text = textOf(workplaceEvaluationPdfGenerator.generate(evaluation, DocumentLanguage.FR));

        // Assert
        assert text.contains("De 08:00 à 16:00");
    }

    @Test
    void shouldWriteNotAnsweredWhenEvaluationIsEmpty() throws IOException {
        // Act
        String text = textOf(workplaceEvaluationPdfGenerator.generate(workplaceEvaluation(), DocumentLanguage.FR));

        // Assert
        assert text.contains("Non répondu");
    }

    @Test
    void shouldShowSigningTimeWhenEvaluationIsSigned() throws IOException {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();
        evaluation.sign(NOW);

        // Act
        String text = textOf(workplaceEvaluationPdfGenerator.generate(evaluation, DocumentLanguage.FR));

        // Assert
        assert text.contains("Signé le 20 novembre 2026 à 14:30");
        assert !text.contains("En attente de signature");
    }

    @Test
    void shouldWriteEvaluationInEnglishWhenUserChoosesEnglish() throws IOException {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();

        // Act
        String text = textOf(workplaceEvaluationPdfGenerator.generate(evaluation, DocumentLanguage.EN));

        // Assert
        assert text.contains("WORKPLACE");
        assert text.contains("From January 11, 2027 to May 2, 2027");
        assert text.contains("$22.50");
        assert text.contains("First internship");
        assert text.contains("Two interns");
        assert text.contains("Pending signature");
    }
}
