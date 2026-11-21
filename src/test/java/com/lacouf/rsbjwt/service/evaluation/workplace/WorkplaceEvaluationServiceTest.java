package com.lacouf.rsbjwt.service.evaluation.workplace;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.workplace.ShiftRange;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceCriterion;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.model.internship.Internship;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.repository.evaluation.workplace.WorkplaceEvaluationRepository;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.SupervisionHoursDto;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceObservationsDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;
import com.lacouf.rsbjwt.service.evaluation.EvaluationService;
import com.lacouf.rsbjwt.service.evaluation.WorkplaceEvaluationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationTestData.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkplaceEvaluationServiceTest {

    @InjectMocks
    private WorkplaceEvaluationService workplaceEvaluationService;

    @Mock
    private EvaluationService evaluationService;
    @Mock
    private AcademicSessionService academicSessionService;

    @Mock
    private WorkplaceEvaluationRepository workplaceEvaluationRepository;

    @Test
    void shouldReturnEvaluationsOfTeacherForChosenSession() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();
        InternshipTracking internshipTracking = evaluation.getTracking();
        Internship internship = internshipTracking.getInternship();
        AcademicSession session = internship.getSession();

        when(academicSessionService.findSessionOrCurrent(1L)).thenReturn(session);
        when(workplaceEvaluationRepository.findByTracking_Teacher_Credentials_EmailAndTracking_Internship_Session(TEACHER_EMAIL, session)).thenReturn(List.of(evaluation));

        // Act
        List<EvaluationResponseDto<WorkplaceEvaluationFormDto>> evaluations = workplaceEvaluationService.getEvaluations(TEACHER_EMAIL, 1L);

        // Assert
        assert evaluations.size() == 1;

        EvaluationResponseDto<WorkplaceEvaluationFormDto> response = evaluations.getFirst();

        assert response.studentName().equals("Léa Tremblay");
        assert response.companyName().equals("Tech Corp");
        assert response.supervisorName().equals("Jean Dupont");
        assert response.complete();
        assert response.form().ratings().get(WorkplaceCriterion.TASKS_MATCH_AGREEMENT) == AgreementLevel.TOTALLY_AGREE;
    }

    @Test
    void shouldReturnEvaluationsWaitingForSignatureOfTeacher() {
        // Arrange
        when(workplaceEvaluationRepository.findByTracking_Teacher_Credentials_EmailAndSignedAtIsNull(TEACHER_EMAIL)).thenReturn(List.of(workplaceEvaluation()));

        // Act
        List<EvaluationResponseDto<WorkplaceEvaluationFormDto>> evaluations = workplaceEvaluationService.getEvaluationsToSign(TEACHER_EMAIL);

        // Assert
        assert evaluations.size() == 1;
        assert !evaluations.getFirst().complete();
    }

    @Test
    void shouldSaveAnswersWhenFormChanges() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = workplaceEvaluation();
        WorkplaceEvaluationFormDto form = new WorkplaceEvaluationFormDto(
                Map.of(WorkplaceCriterion.WORK_CLIMATE_PLEASANT, AgreementLevel.SOMEWHAT_AGREE),
                new SupervisionHoursDto(SUPERVISION_HOURS, null, null), null, "Bon climat de travail", null);

        when(workplaceEvaluationRepository.findByIdAndTracking_Teacher_Credentials_Email(EVALUATION_ID, TEACHER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(evaluationService.getUpdateTime(evaluation)).thenReturn(NOW);
        when(workplaceEvaluationRepository.save(evaluation)).thenReturn(evaluation);

        // Act
        EvaluationResponseDto<WorkplaceEvaluationFormDto> response = workplaceEvaluationService.saveEvaluation(TEACHER_EMAIL, EVALUATION_ID, form);

        // Assert
        assert evaluation.getRatings().get(WorkplaceCriterion.WORK_CLIMATE_PLEASANT) == AgreementLevel.SOMEWHAT_AGREE;
        assert evaluation.getFirstMonthSupervisionHours().equals(SUPERVISION_HOURS);
        assert evaluation.getComments().equals("Bon climat de travail");
        assert NOW.equals(response.updatedAt());
        assert !response.complete();
    }

    @Test
    void shouldNotSaveWhenEvaluationIsAlreadySigned() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();

        when(workplaceEvaluationRepository.findByIdAndTracking_Teacher_Credentials_Email(EVALUATION_ID, TEACHER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(evaluationService.getUpdateTime(evaluation)).thenThrow(new EvaluationAlreadySignedException(EVALUATION_ID));

        // Act + Assert
        assertThrows(EvaluationAlreadySignedException.class, () -> workplaceEvaluationService.saveEvaluation(TEACHER_EMAIL, EVALUATION_ID, emptyForm()));

        verify(workplaceEvaluationRepository, never()).save(any(WorkplaceEvaluation.class));
    }

    @Test
    void shouldThrowNotFoundWhenEvaluationIsNotOfTeacher() {
        // Arrange
        when(workplaceEvaluationRepository.findByIdAndTracking_Teacher_Credentials_Email(EVALUATION_ID, TEACHER_EMAIL)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(EvaluationNotFoundException.class, () -> workplaceEvaluationService.saveEvaluation(TEACHER_EMAIL, EVALUATION_ID, emptyForm()));

        verifyNoInteractions(evaluationService);
    }

    @Test
    void shouldSignEvaluationWithPasswordOfTeacher() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();

        when(workplaceEvaluationRepository.findByIdAndTracking_Teacher_Credentials_Email(EVALUATION_ID, TEACHER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(workplaceEvaluationRepository.save(evaluation)).thenReturn(evaluation);

        // Act
        workplaceEvaluationService.signEvaluation(TEACHER_EMAIL, EVALUATION_ID, PASSWORD);

        // Assert
        verify(evaluationService).sign(evaluation, TEACHER_EMAIL, PASSWORD);
        verify(workplaceEvaluationRepository).save(evaluation);
    }

    @Test
    void shouldSignEvaluationWithoutPasswordInDevMode() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();

        when(workplaceEvaluationRepository.findByIdAndTracking_Teacher_Credentials_Email(EVALUATION_ID, TEACHER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(workplaceEvaluationRepository.save(evaluation)).thenReturn(evaluation);

        // Act
        workplaceEvaluationService.devSignEvaluation(TEACHER_EMAIL, EVALUATION_ID);

        // Assert
        verify(evaluationService).signWithoutPassword(evaluation);
        verify(workplaceEvaluationRepository).save(evaluation);
    }

    @Test
    void shouldRemoveRatingWhenItIsSentAsNull() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();

        Map<WorkplaceCriterion, AgreementLevel> ratings = new HashMap<>(evaluation.getRatings());
        ratings.put(WorkplaceCriterion.WORKLOAD_ACCEPTABLE, null);

        mockSave(evaluation);

        // Act
        EvaluationResponseDto<WorkplaceEvaluationFormDto> response = workplaceEvaluationService.saveEvaluation(TEACHER_EMAIL, EVALUATION_ID,
                new WorkplaceEvaluationFormDto(ratings, null, null, null, null));

        // Assert
        assert !evaluation.getRatings().containsKey(WorkplaceCriterion.WORKLOAD_ACCEPTABLE);
        assert !response.complete();
    }

    @Test
    void shouldIgnoreShiftRangesWhenShiftsAreNotVariable() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = workplaceEvaluation();
        WorkplaceObservationsDto observations = new WorkplaceObservationsDto(null, null, null, false,
                List.of(new ShiftRange(LocalTime.of(8, 0), LocalTime.of(16, 0))));

        mockSave(evaluation);

        // Act
        workplaceEvaluationService.saveEvaluation(TEACHER_EMAIL, EVALUATION_ID, new WorkplaceEvaluationFormDto(null, null, null, null, observations));

        // Assert
        assert evaluation.getShiftRanges().isEmpty();
    }

    // ---------- Helpers ----------

    private static WorkplaceEvaluationFormDto emptyForm() {
        return new WorkplaceEvaluationFormDto(null, null, null, null, null);
    }

    private void mockSave(WorkplaceEvaluation evaluation) throws Exception {
        when(workplaceEvaluationRepository.findByIdAndTracking_Teacher_Credentials_Email(EVALUATION_ID, TEACHER_EMAIL)).thenReturn(Optional.of(evaluation));
        when(evaluationService.getUpdateTime(evaluation)).thenReturn(NOW);
        when(workplaceEvaluationRepository.save(evaluation)).thenReturn(evaluation);
    }
}
