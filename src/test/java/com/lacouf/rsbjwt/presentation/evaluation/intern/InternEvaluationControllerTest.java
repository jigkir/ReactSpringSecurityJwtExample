package com.lacouf.rsbjwt.presentation.evaluation.intern;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.intern.InternCriterion;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluation;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluationSection;
import com.lacouf.rsbjwt.model.evaluation.intern.NextInternshipInterest;
import com.lacouf.rsbjwt.service.dto.request.evaluation.intern.InternEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.evaluation.intern.InternEvaluationService;
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
@WebMvcTest(InternEvaluationController.class)
public class InternEvaluationControllerTest {

    private static final String EVALUATIONS_PATH = "/api/employer/intern-evaluations";
    private static final String EVALUATION_PATH = EVALUATIONS_PATH + "/" + EVALUATION_ID;
    private static final String SIGNATURE_PATH = EVALUATION_PATH + "/signature";
    private static final String SIGNATURE_BODY = "{\"termsAccepted\": true, \"password\": \"Test123@\"}";
    private static final String FORM_BODY = """
            {
              "ratings": {"MEET_DEADLINES": "CANNOT_SAY"},
              "sectionComments": {"PRODUCTIVITY": "Respecte ses échéanciers."},
              "nextInternshipInterest": "MAYBE",
              "supervisorJobTitle": "Chef d'équipe"
            }
            """;

    private final Authentication employerAuthentication = new UsernamePasswordAuthenticationToken(EMPLOYER_EMAIL, null);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InternEvaluationService internEvaluationService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnEvaluationsOfChosenSession() throws Exception {
        // Arrange
        when(internEvaluationService.getEvaluations(EMPLOYER_EMAIL, 1L)).thenReturn(List.of(internResponse(completeInternEvaluation())));

        // Act + Assert
        mockMvc.perform(get(EVALUATIONS_PATH).param("sessionId", "1").principal(employerAuthentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].studentName").value("Léa Tremblay"))
                .andExpect(jsonPath("$[0].studentDiscipline").value("COMPUTER_SCIENCE"))
                .andExpect(jsonPath("$[0].form.ratings.PLAN_AND_ORGANIZE_WORK").value("TOTALLY_AGREE"))
                .andExpect(jsonPath("$[0].form.overallAppreciation").value("EXCEEDS_EXPECTATIONS"))
                .andExpect(jsonPath("$[0].complete").value(true));

        verify(internEvaluationService).getEvaluations(EMPLOYER_EMAIL, 1L);
    }

    @Test
    void shouldReturnEvaluationsWaitingForSignature() throws Exception {
        // Arrange
        when(internEvaluationService.getEvaluationsToSign(EMPLOYER_EMAIL)).thenReturn(List.of(internResponse(internEvaluation())));

        // Act + Assert
        mockMvc.perform(get(EVALUATIONS_PATH + "/to-sign").principal(employerAuthentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].complete").value(false));
    }

    @Test
    void shouldSaveEvaluationWhenFormChanges() throws Exception {
        // Arrange
        ArgumentCaptor<InternEvaluationFormDto> formCaptor = ArgumentCaptor.forClass(InternEvaluationFormDto.class);

        when(internEvaluationService.saveEvaluation(eq(EMPLOYER_EMAIL), eq(EVALUATION_ID), any(InternEvaluationFormDto.class)))
                .thenReturn(internResponse(internEvaluation()));

        // Act + Assert
        mockMvc.perform(put(EVALUATION_PATH).principal(employerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORM_BODY))
                .andExpect(status().isOk());

        verify(internEvaluationService).saveEvaluation(eq(EMPLOYER_EMAIL), eq(EVALUATION_ID), formCaptor.capture());

        InternEvaluationFormDto form = formCaptor.getValue();
        assert form.ratings().get(InternCriterion.MEET_DEADLINES) == AgreementLevel.CANNOT_SAY;
        assert form.sectionComments().get(InternEvaluationSection.PRODUCTIVITY).equals("Respecte ses échéanciers.");
        assert form.nextInternshipInterest() == NextInternshipInterest.MAYBE;
    }

    @Test
    void shouldReturnConflictWhenSavingSignedEvaluation() throws Exception {
        // Arrange
        when(internEvaluationService.saveEvaluation(eq(EMPLOYER_EMAIL), eq(EVALUATION_ID), any(InternEvaluationFormDto.class)))
                .thenThrow(new EvaluationAlreadySignedException(EVALUATION_ID));

        // Act + Assert
        mockMvc.perform(put(EVALUATION_PATH).principal(employerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORM_BODY))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldSignEvaluationWhenTermsAreAccepted() throws Exception {
        // Arrange
        InternEvaluation evaluation = completeInternEvaluation();
        evaluation.sign(NOW);

        when(internEvaluationService.signEvaluation(EMPLOYER_EMAIL, EVALUATION_ID, PASSWORD)).thenReturn(internResponse(evaluation));

        // Act + Assert
        mockMvc.perform(put(SIGNATURE_PATH).principal(employerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SIGNATURE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.signedAt").value("2026-11-20T14:30:00"));

        verify(internEvaluationService).signEvaluation(EMPLOYER_EMAIL, EVALUATION_ID, PASSWORD);
    }

    @Test
    void shouldReturnBadRequestWhenPasswordIsMissing() throws Exception {
        // Act + Assert
        mockMvc.perform(put(SIGNATURE_PATH).principal(employerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"termsAccepted\": true, \"password\": \"\"}"))
                .andExpect(status().isBadRequest());

        verify(internEvaluationService, never()).signEvaluation(anyString(), anyLong(), anyString());
    }

    @Test
    void shouldReturnBadRequestWhenSigningIncompleteEvaluation() throws Exception {
        // Arrange
        when(internEvaluationService.signEvaluation(EMPLOYER_EMAIL, EVALUATION_ID, PASSWORD)).thenThrow(new EvaluationIncompleteException(EVALUATION_ID));

        // Act + Assert
        mockMvc.perform(put(SIGNATURE_PATH).principal(employerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SIGNATURE_BODY))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnPdfOfEvaluationInChosenLanguage() throws Exception {
        // Arrange
        DocumentFileResponseDto file = new DocumentFileResponseDto(EVALUATION_ID, "evaluation-stagiaire-40.pdf", new byte[]{1, 2, 3});

        when(internEvaluationService.getEvaluationFile(EMPLOYER_EMAIL, EVALUATION_ID, DocumentLanguage.FR)).thenReturn(file);

        // Act + Assert
        mockMvc.perform(get(EVALUATION_PATH + "/file").param("language", "FR").principal(employerAuthentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("evaluation-stagiaire-40.pdf"));

        verify(internEvaluationService).getEvaluationFile(EMPLOYER_EMAIL, EVALUATION_ID, DocumentLanguage.FR);
    }
}
