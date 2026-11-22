package com.lacouf.rsbjwt.presentation.evaluation;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.evaluation.workplace.WorkplaceEvaluationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static com.lacouf.rsbjwt.service.evaluation.EvaluationTestData.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(GlobalExceptionHandler.class)
@WebMvcTest(ManagerEvaluationController.class)
public class ManagerEvaluationControllerTest {

    private static final String WORKPLACE_EVALUATIONS_PATH = "/api/manager/workplace-evaluations";
    private static final String WORKPLACE_FILE_PATH = WORKPLACE_EVALUATIONS_PATH + "/" + EVALUATION_ID + "/file";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorkplaceEvaluationService workplaceEvaluationService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnSignedWorkplaceEvaluationsOfChosenSession() throws Exception {
        // Arrange
        when(workplaceEvaluationService.getSignedEvaluations(1L)).thenReturn(List.of(workplaceResponse(completeWorkplaceEvaluation())));

        // Act + Assert
        mockMvc.perform(get(WORKPLACE_EVALUATIONS_PATH).param("sessionId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].studentName").value("Léa Tremblay"))
                .andExpect(jsonPath("$[0].form.ratings.TASKS_MATCH_AGREEMENT").value("TOTALLY_AGREE"));

        verify(workplaceEvaluationService).getSignedEvaluations(1L);
    }

    @Test
    void shouldReturnPdfOfSignedWorkplaceEvaluation() throws Exception {
        // Arrange
        DocumentFileResponseDto file = new DocumentFileResponseDto(EVALUATION_ID, "evaluation-milieu-de-stage-40.pdf", new byte[]{1, 2, 3});

        when(workplaceEvaluationService.getSignedEvaluationFile(EVALUATION_ID, DocumentLanguage.FR)).thenReturn(file);

        // Act + Assert
        mockMvc.perform(get(WORKPLACE_FILE_PATH).param("language", "FR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("evaluation-milieu-de-stage-40.pdf"));
    }

    @Test
    void shouldReturnNotFoundWhenWorkplaceEvaluationIsNotSigned() throws Exception {
        // Arrange
        when(workplaceEvaluationService.getSignedEvaluationFile(EVALUATION_ID, DocumentLanguage.FR)).thenThrow(new EvaluationNotFoundException(EVALUATION_ID));

        // Act + Assert
        mockMvc.perform(get(WORKPLACE_FILE_PATH).param("language", "FR"))
                .andExpect(status().isNotFound());
    }
}
