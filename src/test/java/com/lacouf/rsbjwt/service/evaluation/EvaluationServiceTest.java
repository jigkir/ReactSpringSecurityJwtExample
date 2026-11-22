package com.lacouf.rsbjwt.service.evaluation;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.exception.signature.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.intern.InternCriterion;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluation;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceCriterion;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Teacher;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationTestData.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EvaluationServiceTest {

    private EvaluationService evaluationService;

    @Mock
    private UserAppService userAppService;
    @Mock
    private NotificationService notificationService;

    @Mock
    private ManagerRepository managerRepository;


    @BeforeEach
    void setUp() {
        ZoneId zone = ZoneId.systemDefault();
        evaluationService = new EvaluationService(userAppService, notificationService, managerRepository, Clock.fixed(NOW.atZone(zone).toInstant(), zone));
    }

    @Test
    void shouldThrowAlreadySignedWhenUpdatingSignedEvaluation() {
        // Arrange
        WorkplaceEvaluation evaluation = signedWorkplaceEvaluation();

        // Act + Assert
        assertThrows(EvaluationAlreadySignedException.class, () -> evaluationService.getUpdateTime(evaluation));
    }

    @Test
    void shouldSignWhenPasswordIsCorrectAndEvaluationIsComplete() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();
        InternshipTracking internshipTracking = evaluation.getTracking();
        Teacher teacher = internshipTracking.getTeacher();

        when(userAppService.findUserByEmail(TEACHER_EMAIL)).thenReturn(teacher);

        // Act
        evaluationService.sign(evaluation, TEACHER_EMAIL, PASSWORD);

        // Assert
        assert NOW.equals(evaluation.getSignedAt());

        verify(userAppService).verifyIfSignaturePasswordIsIncorrect(teacher, PASSWORD);
    }

    @Test
    void shouldNotSignWhenPasswordIsIncorrect() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();
        InternshipTracking internshipTracking = evaluation.getTracking();
        Teacher teacher = internshipTracking.getTeacher();

        when(userAppService.findUserByEmail(TEACHER_EMAIL)).thenReturn(teacher);

        doThrow(new IncorrectSignaturePasswordException()).when(userAppService).verifyIfSignaturePasswordIsIncorrect(teacher, PASSWORD);

        // Act + Assert
        assertThrows(IncorrectSignaturePasswordException.class, () -> evaluationService.sign(evaluation, TEACHER_EMAIL, PASSWORD));

        assert !evaluation.isSigned();
    }

    @Test
    void shouldSignWithoutPasswordWhenEvaluationIsComplete() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();

        // Act
        evaluationService.signWithoutPassword(evaluation);

        // Assert
        assert NOW.equals(evaluation.getSignedAt());

        verifyNoInteractions(userAppService);
    }

    @Test
    void shouldThrowIncompleteWhenSigningIncompleteEvaluation() {
        // Arrange
        WorkplaceEvaluation evaluation = workplaceEvaluation();

        // Act + Assert
        assertThrows(EvaluationIncompleteException.class, () -> evaluationService.signWithoutPassword(evaluation));

        assert !evaluation.isSigned();
    }

    @Test
    void shouldThrowAlreadySignedWhenSigningTwice() {
        // Arrange
        WorkplaceEvaluation evaluation = signedWorkplaceEvaluation();

        // Act + Assert
        assertThrows(EvaluationAlreadySignedException.class, () -> evaluationService.signWithoutPassword(evaluation));
    }

    @Test
    void shouldThrowIncompleteWhenWorkplaceCriterionIsNotRated() {
        // Arrange
        Map<WorkplaceCriterion, AgreementLevel> ratings = allWorkplaceCriteriaTotallyAgree();
        ratings.remove(WorkplaceCriterion.WORKLOAD_ACCEPTABLE);

        WorkplaceEvaluation evaluation = workplaceEvaluation();
        answerWorkplaceEvaluation(evaluation, ratings, HOURLY_SALARY, null, false, List.of());

        // Act + Assert
        assertThrows(EvaluationIncompleteException.class, () -> evaluationService.signWithoutPassword(evaluation));
    }

    @Test
    void shouldThrowIncompleteWhenDisagreementIsNotExplained() {
        // Arrange
        Map<WorkplaceCriterion, AgreementLevel> ratings = allWorkplaceCriteriaTotallyAgree();
        ratings.put(WorkplaceCriterion.WORKLOAD_ACCEPTABLE, AgreementLevel.SOMEWHAT_DISAGREE);

        WorkplaceEvaluation evaluation = workplaceEvaluation();
        answerWorkplaceEvaluation(evaluation, ratings, HOURLY_SALARY, " ", false, List.of());

        // Act + Assert
        assertThrows(EvaluationIncompleteException.class, () -> evaluationService.signWithoutPassword(evaluation));
    }

    @Test
    void shouldSignWhenDisagreementIsExplained() throws Exception {
        // Arrange
        Map<WorkplaceCriterion, AgreementLevel> ratings = allWorkplaceCriteriaTotallyAgree();
        ratings.put(WorkplaceCriterion.WORKLOAD_ACCEPTABLE, AgreementLevel.TOTALLY_DISAGREE);

        WorkplaceEvaluation evaluation = workplaceEvaluation();
        answerWorkplaceEvaluation(evaluation, ratings, HOURLY_SALARY, "Trop de tâches pour une seule personne.", false, List.of());

        // Act
        evaluationService.signWithoutPassword(evaluation);

        // Assert
        assert evaluation.isSigned();
    }

    @Test
    void shouldThrowIncompleteWhenHourlySalaryIsMissing() {
        // Arrange
        WorkplaceEvaluation evaluation = workplaceEvaluation();
        answerWorkplaceEvaluation(evaluation, allWorkplaceCriteriaTotallyAgree(), null, null, false, List.of());

        // Act + Assert
        assertThrows(EvaluationIncompleteException.class, () -> evaluationService.signWithoutPassword(evaluation));
    }

    @Test
    void shouldSignWithoutHourlySalaryWhenSalaryCannotBeJudged() throws Exception {
        // Arrange
        Map<WorkplaceCriterion, AgreementLevel> ratings = allWorkplaceCriteriaTotallyAgree();
        ratings.put(WorkplaceCriterion.SALARY_INTERESTING, AgreementLevel.CANNOT_SAY);

        WorkplaceEvaluation evaluation = workplaceEvaluation();
        answerWorkplaceEvaluation(evaluation, ratings, null, null, false, List.of());

        // Act
        evaluationService.signWithoutPassword(evaluation);

        // Assert
        assert evaluation.isSigned();
    }

    @Test
    void shouldThrowIncompleteWhenVariableShiftsHaveNoRange() {
        // Arrange
        WorkplaceEvaluation evaluation = workplaceEvaluation();
        answerWorkplaceEvaluation(evaluation, allWorkplaceCriteriaTotallyAgree(), HOURLY_SALARY, null, true, List.of());

        // Act + Assert
        assertThrows(EvaluationIncompleteException.class, () -> evaluationService.signWithoutPassword(evaluation));
    }

    @Test
    void shouldNameFileWithPrefixAndIdWhenCreatingFile() {
        // Arrange
        byte[] content = {1, 2, 3};

        // Act
        DocumentFileResponseDto file = evaluationService.toFile(workplaceEvaluation(), "evaluation-milieu-de-stage-", content);

        // Assert
        assert file.id() == EVALUATION_ID;
        assert file.fileName().equals("evaluation-milieu-de-stage-40.pdf");
        assert file.content() == content;
    }

    @Test
    void shouldCloseNotificationToFillWhenEvaluationIsSigned() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();

        // Act
        evaluationService.signWithoutPassword(evaluation);

        // Assert
        verify(notificationService).closeNotificationsOfType(NotificationType.WORKPLACE_EVALUATION_TO_FILL, EVALUATION_ID);
    }

    @Test
    void shouldNotifyManagersWhenEvaluationIsSigned() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();
        Manager manager = manager();

        when(managerRepository.findAll()).thenReturn(List.of(manager));

        // Act
        evaluationService.signWithoutPassword(evaluation);

        // Assert
        verify(notificationService).notifyIfAbsent(NotificationType.WORKPLACE_EVALUATION_SIGNED, EVALUATION_ID, manager);
    }

    @Test
    void shouldSignInternEvaluationWhenEveryQuestionIsAnswered() throws Exception {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();

        // Act
        evaluationService.signWithoutPassword(evaluation);

        // Assert
        assert NOW.equals(evaluation.getSignedAt());
    }

    @Test
    void shouldThrowIncompleteWhenInternCriterionIsNotRated() {
        // Arrange
        Map<InternCriterion, AgreementLevel> ratings = ratingsOf(InternCriterion.class, AgreementLevel.SOMEWHAT_AGREE);
        ratings.remove(InternCriterion.BE_PUNCTUAL_AND_ASSIDUOUS);

        InternEvaluation evaluation = internEvaluation();
        answerInternEvaluation(evaluation, ratings, "Très travaillant.", "Développeur principal");

        // Act + Assert
        assertThrows(EvaluationIncompleteException.class, () -> evaluationService.signWithoutPassword(evaluation));
    }

    @Test
    void shouldThrowIncompleteWhenAppreciationIsNotDetailed() {
        // Arrange
        InternEvaluation evaluation = internEvaluation();
        answerInternEvaluation(evaluation, ratingsOf(InternCriterion.class, AgreementLevel.TOTALLY_AGREE), " ", "Développeur principal");

        // Act + Assert
        assertThrows(EvaluationIncompleteException.class, () -> evaluationService.signWithoutPassword(evaluation));
    }

    @Test
    void shouldThrowIncompleteWhenSupervisorJobTitleIsMissing() {
        // Arrange
        InternEvaluation evaluation = internEvaluation();
        answerInternEvaluation(evaluation, ratingsOf(InternCriterion.class, AgreementLevel.TOTALLY_AGREE), "Très travaillant.", null);

        // Act + Assert
        assertThrows(EvaluationIncompleteException.class, () -> evaluationService.signWithoutPassword(evaluation));
    }

    @Test
    void shouldNotifyManagersWithInternNotificationWhenInternEvaluationIsSigned() throws Exception {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();
        Manager manager = manager();

        when(managerRepository.findAll()).thenReturn(List.of(manager));

        // Act
        evaluationService.signWithoutPassword(evaluation);

        // Assert
        verify(notificationService).closeNotificationsOfType(NotificationType.INTERN_EVALUATION_TO_FILL, EVALUATION_ID);
        verify(notificationService).notifyIfAbsent(NotificationType.INTERN_EVALUATION_SIGNED, EVALUATION_ID, manager);
    }

    // ---------- Helpers ----------

    private static WorkplaceEvaluation signedWorkplaceEvaluation() {
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();
        evaluation.sign(NOW);

        return evaluation;
    }

    private static Map<WorkplaceCriterion, AgreementLevel> allWorkplaceCriteriaTotallyAgree() {
        return ratingsOf(WorkplaceCriterion.class, AgreementLevel.TOTALLY_AGREE);
    }

    private static Manager manager() {
        Credentials credentials = Credentials.builder().email("gestion.stages@claurendeau.qc.ca").role(Role.MANAGER).build();

        return new Manager("John", "Doe", credentials, "450-555-0000");
    }
}
