package com.lacouf.rsbjwt.service.evaluation.intern;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.intern.InternCriterion;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluation;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluationSection;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.repository.evaluation.intern.InternEvaluationRepository;
import com.lacouf.rsbjwt.service.dto.request.evaluation.intern.InternEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;
import com.lacouf.rsbjwt.service.evaluation.EvaluationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationTestData.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InternEvaluationServiceTest {

    @InjectMocks
    private InternEvaluationService internEvaluationService;

    @Mock
    private InternEvaluationRepository internEvaluationRepository;

    @Mock
    private EvaluationService evaluationService;
    @Mock
    private AcademicSessionService academicSessionService;
    @Mock
    private InternEvaluationPdfGenerator internEvaluationPdfGenerator;

    @Test
    void shouldReturnEvaluationsOfEmployerForChosenSession() throws Exception {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();
        AcademicSession session = evaluation.getTracking().getSession();

        when(academicSessionService.findSessionOrCurrent(1L)).thenReturn(session);
        when(internEvaluationRepository.findByTracking_Internship_PostedBy_Credentials_EmailAndTracking_Internship_Session(EMPLOYER_EMAIL, session)).thenReturn(List.of(evaluation));

        // Act
        List<EvaluationResponseDto<InternEvaluationFormDto>> evaluations = internEvaluationService.getEvaluations(EMPLOYER_EMAIL, 1L);

        // Assert
        assert evaluations.size() == 1;

        EvaluationResponseDto<InternEvaluationFormDto> response = evaluations.getFirst();
        assert response.studentName().equals("Léa Tremblay");
        assert response.complete();
        assert response.form().supervisorJobTitle().equals("Développeur principal");
    }

    @Test
    void shouldReturnEvaluationsWaitingForSignatureOfEmployer() {
        // Arrange
        when(internEvaluationRepository.findByTracking_Internship_PostedBy_Credentials_EmailAndSignedAtIsNull(EMPLOYER_EMAIL)).thenReturn(List.of(internEvaluation()));

        // Act
        List<EvaluationResponseDto<InternEvaluationFormDto>> evaluations = internEvaluationService.getEvaluationsToSign(EMPLOYER_EMAIL);

        // Assert
        assert evaluations.size() == 1;
        assert !evaluations.getFirst().complete();
    }

    @Test
    void shouldSaveAnswersWhenFormChanges() throws Exception {
        // Arrange
        InternEvaluation evaluation = internEvaluation();
        InternEvaluationFormDto form = new InternEvaluationFormDto(
                Map.of(InternCriterion.SHOW_INITIATIVE, AgreementLevel.SOMEWHAT_AGREE),
                Map.of(InternEvaluationSection.PERSONAL_SKILLS, "Prend des initiatives."),
                null, null, null, SUPERVISION_HOURS, null, null, "Chef d'équipe");

        when(internEvaluationRepository.findByIdAndTracking_Internship_PostedBy_Credentials_Email(EVALUATION_ID, EMPLOYER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(evaluationService.getUpdateTime(evaluation)).thenReturn(NOW);
        when(internEvaluationRepository.save(evaluation)).thenReturn(evaluation);

        // Act
        EvaluationResponseDto<InternEvaluationFormDto> response = internEvaluationService.saveEvaluation(EMPLOYER_EMAIL, EVALUATION_ID, form);

        // Assert
        assert evaluation.getRatings().get(InternCriterion.SHOW_INITIATIVE) == AgreementLevel.SOMEWHAT_AGREE;
        assert evaluation.getSectionComments().get(InternEvaluationSection.PERSONAL_SKILLS).equals("Prend des initiatives.");
        assert evaluation.getSupervisorJobTitle().equals("Chef d'équipe");
        assert NOW.equals(response.updatedAt());
        assert !response.complete();
    }

    @Test
    void shouldNotSaveWhenEvaluationIsAlreadySigned() throws Exception {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();

        when(internEvaluationRepository.findByIdAndTracking_Internship_PostedBy_Credentials_Email(EVALUATION_ID, EMPLOYER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(evaluationService.getUpdateTime(evaluation)).thenThrow(new EvaluationAlreadySignedException(EVALUATION_ID));

        // Act + Assert
        assertThrows(EvaluationAlreadySignedException.class, () -> internEvaluationService.saveEvaluation(EMPLOYER_EMAIL, EVALUATION_ID, emptyForm()));

        verify(internEvaluationRepository, never()).save(any(InternEvaluation.class));
    }

    @Test
    void shouldThrowNotFoundWhenEvaluationIsNotOfEmployer() {
        // Arrange
        when(internEvaluationRepository.findByIdAndTracking_Internship_PostedBy_Credentials_Email(EVALUATION_ID, EMPLOYER_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(EvaluationNotFoundException.class, () -> internEvaluationService.saveEvaluation(EMPLOYER_EMAIL, EVALUATION_ID, emptyForm()));

        verifyNoInteractions(evaluationService);
    }

    @Test
    void shouldSignEvaluationWithPasswordOfEmployer() throws Exception {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();

        when(internEvaluationRepository.findByIdAndTracking_Internship_PostedBy_Credentials_Email(EVALUATION_ID, EMPLOYER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(internEvaluationRepository.save(evaluation)).thenReturn(evaluation);

        // Act
        internEvaluationService.signEvaluation(EMPLOYER_EMAIL, EVALUATION_ID, PASSWORD);

        // Assert
        verify(evaluationService).sign(evaluation, EMPLOYER_EMAIL, PASSWORD);
        verify(internEvaluationRepository).save(evaluation);
    }

    @Test
    void shouldSignEvaluationWithoutPasswordInDevMode() throws Exception {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();

        when(internEvaluationRepository.findByIdAndTracking_Internship_PostedBy_Credentials_Email(EVALUATION_ID, EMPLOYER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(internEvaluationRepository.save(evaluation)).thenReturn(evaluation);

        // Act
        internEvaluationService.devSignEvaluation(EMPLOYER_EMAIL, EVALUATION_ID);

        // Assert
        verify(evaluationService).signWithoutPassword(evaluation);
        verify(internEvaluationRepository).save(evaluation);
    }

    @Test
    void shouldGeneratePdfOfEvaluationInChosenLanguage() throws Exception {
        // Arrange
        InternEvaluation evaluation = internEvaluation();
        byte[] content = {1, 2, 3};
        DocumentFileResponseDto file = new DocumentFileResponseDto(EVALUATION_ID, "evaluation-stagiaire-40.pdf", content);

        when(internEvaluationRepository.findByIdAndTracking_Internship_PostedBy_Credentials_Email(EVALUATION_ID, EMPLOYER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(internEvaluationPdfGenerator.generate(evaluation, DocumentLanguage.FR)).thenReturn(content);
        when(evaluationService.toFile(evaluation, "evaluation-stagiaire-", content)).thenReturn(file);

        // Act
        DocumentFileResponseDto result = internEvaluationService.getEvaluationFile(EMPLOYER_EMAIL, EVALUATION_ID, DocumentLanguage.FR);

        // Assert
        assert result == file;
    }

    @Test
    void shouldNotGeneratePdfWhenEvaluationIsNotOfEmployer() {
        // Arrange
        when(internEvaluationRepository.findByIdAndTracking_Internship_PostedBy_Credentials_Email(EVALUATION_ID, EMPLOYER_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(EvaluationNotFoundException.class, () -> internEvaluationService.getEvaluationFile(EMPLOYER_EMAIL, EVALUATION_ID, DocumentLanguage.FR));

        verifyNoInteractions(internEvaluationPdfGenerator);
    }

    // ---------- Helpers ----------

    private static InternEvaluationFormDto emptyForm() {
        return new InternEvaluationFormDto(null, null, null, null, null, null, null, null, null);
    }
}
