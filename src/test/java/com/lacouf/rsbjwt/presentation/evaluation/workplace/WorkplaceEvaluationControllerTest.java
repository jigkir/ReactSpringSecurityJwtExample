package com.lacouf.rsbjwt.presentation.evaluation.workplace;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceCriterion;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceEvaluationFormDto;
import com.lacouf.rsbjwt.service.evaluation.WorkplaceEvaluationService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalTime;
import java.util.List;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationTestData.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(GlobalExceptionHandler.class)
@WebMvcTest(WorkplaceEvaluationController.class)
public class WorkplaceEvaluationControllerTest {

    private static final String EVALUATIONS_PATH = "/api/teacher/workplace-evaluations";
    private static final String EVALUATION_PATH = EVALUATIONS_PATH + "/" + EVALUATION_ID;
    private static final String SIGNATURE_PATH = EVALUATION_PATH + "/signature";
    private static final String SIGNATURE_BODY = "{\"termsAccepted\": true, \"password\": \"Test123@\"}";
    private static final String FORM_BODY = """
            {
              "ratings": {"TASKS_MATCH_AGREEMENT": "TOTALLY_AGREE"},
              "supervisionHoursPerWeek": {"month1": 7.5},
              "comments": "Bon encadrement",
              "generalObservations": {"variableShifts": true, "shiftRanges": [{"from": "08:00", "to": "16:00"}]}
            }
            """;

    private final Authentication teacherAuthentication = new UsernamePasswordAuthenticationToken(TEACHER_EMAIL, null);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorkplaceEvaluationService workplaceEvaluationService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnEvaluationsOfChosenSession() throws Exception {
        // Arrange
        when(workplaceEvaluationService.getEvaluations(TEACHER_EMAIL, 1L)).thenReturn(List.of(workplaceResponse(completeWorkplaceEvaluation())));

        // Act + Assert
        mockMvc.perform(get(EVALUATIONS_PATH).param("sessionId", "1").principal(teacherAuthentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].studentName").value("Léa Tremblay"))
                .andExpect(jsonPath("$[0].companyName").value("Tech Corp"))
                .andExpect(jsonPath("$[0].internshipEndDate").value("2027-05-02"))
                .andExpect(jsonPath("$[0].form.ratings.TASKS_MATCH_AGREEMENT").value("TOTALLY_AGREE"))
                .andExpect(jsonPath("$[0].complete").value(true));

        verify(workplaceEvaluationService).getEvaluations(TEACHER_EMAIL, 1L);
    }

    @Test
    void shouldReturnEvaluationsWaitingForSignature() throws Exception {
        // Arrange
        when(workplaceEvaluationService.getEvaluationsToSign(TEACHER_EMAIL)).thenReturn(List.of(workplaceResponse(workplaceEvaluation())));

        // Act + Assert
        mockMvc.perform(get(EVALUATIONS_PATH + "/to-sign").principal(teacherAuthentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].complete").value(false))
                .andExpect(jsonPath("$[0].signedAt").doesNotExist());
    }

    @Test
    void shouldSaveEvaluationWhenFormChanges() throws Exception {
        // Arrange
        ArgumentCaptor<WorkplaceEvaluationFormDto> formCaptor = ArgumentCaptor.forClass(WorkplaceEvaluationFormDto.class);

        when(workplaceEvaluationService.saveEvaluation(eq(TEACHER_EMAIL), eq(EVALUATION_ID), any(WorkplaceEvaluationFormDto.class)))
                .thenReturn(workplaceResponse(workplaceEvaluation()));

        // Act + Assert
        mockMvc.perform(put(EVALUATION_PATH).principal(teacherAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORM_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(EVALUATION_ID));

        verify(workplaceEvaluationService).saveEvaluation(eq(TEACHER_EMAIL), eq(EVALUATION_ID), formCaptor.capture());

        WorkplaceEvaluationFormDto form = formCaptor.getValue();

        assert form.ratings().get(WorkplaceCriterion.TASKS_MATCH_AGREEMENT) == AgreementLevel.TOTALLY_AGREE;
        assert form.supervisionHoursPerWeek().month1().equals(SUPERVISION_HOURS);
        assert form.generalObservations().shiftRanges().getFirst().from().equals(LocalTime.of(8, 0));
    }

    @Test
    void shouldReturnBadRequestWhenSupervisionHoursAreNegative() throws Exception {
        // Act + Assert
        mockMvc.perform(put(EVALUATION_PATH).principal(teacherAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"supervisionHoursPerWeek\": {\"month1\": -1}}"))
                .andExpect(status().isBadRequest());

        verify(workplaceEvaluationService, never()).saveEvaluation(anyString(), anyLong(), any(WorkplaceEvaluationFormDto.class));
    }

    @Test
    void shouldReturnConflictWhenSavingSignedEvaluation() throws Exception {
        // Arrange
        when(workplaceEvaluationService.saveEvaluation(eq(TEACHER_EMAIL), eq(EVALUATION_ID), any(WorkplaceEvaluationFormDto.class)))
                .thenThrow(new EvaluationAlreadySignedException(EVALUATION_ID));

        // Act + Assert
        mockMvc.perform(put(EVALUATION_PATH).principal(teacherAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORM_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Evaluation 40 is already signed and can no longer be changed."));
    }

    @Test
    void shouldSignEvaluationWhenTermsAreAccepted() throws Exception {
        // Arrange
        WorkplaceEvaluation evaluation = completeWorkplaceEvaluation();
        evaluation.sign(NOW);

        when(workplaceEvaluationService.signEvaluation(TEACHER_EMAIL, EVALUATION_ID, PASSWORD)).thenReturn(workplaceResponse(evaluation));

        // Act + Assert
        mockMvc.perform(put(SIGNATURE_PATH).principal(teacherAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SIGNATURE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.signedAt").value("2026-11-20T14:30:00"));

        verify(workplaceEvaluationService).signEvaluation(TEACHER_EMAIL, EVALUATION_ID, PASSWORD);
    }

    @Test
    void shouldReturnBadRequestWhenTermsAreNotAccepted() throws Exception {
        // Act + Assert
        mockMvc.perform(put(SIGNATURE_PATH).principal(teacherAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termsAccepted\": false, \"password\": \"Test123@\"}"))
                .andExpect(status().isBadRequest());

        verify(workplaceEvaluationService, never()).signEvaluation(anyString(), anyLong(), anyString());
    }

    @Test
    void shouldReturnBadRequestWhenSigningIncompleteEvaluation() throws Exception {
        // Arrange
        when(workplaceEvaluationService.signEvaluation(TEACHER_EMAIL, EVALUATION_ID, PASSWORD)).thenThrow(new EvaluationIncompleteException(EVALUATION_ID));

        // Act + Assert
        mockMvc.perform(put(SIGNATURE_PATH).principal(teacherAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SIGNATURE_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Evaluation 40 must be complete before it is signed."));
    }

    @Test
    void shouldReturnNotFoundWhenEvaluationIsNotOfTeacher() throws Exception {
        // Arrange
        when(workplaceEvaluationService.signEvaluation(TEACHER_EMAIL, EVALUATION_ID, PASSWORD)).thenThrow(new EvaluationNotFoundException(EVALUATION_ID));

        // Act + Assert
        mockMvc.perform(put(SIGNATURE_PATH).principal(teacherAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SIGNATURE_BODY))
                .andExpect(status().isNotFound());
    }
}
