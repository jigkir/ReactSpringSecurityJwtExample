package com.lacouf.rsbjwt.presentation.session;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.service.dto.response.session.AcademicSessionResponseDto;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(GlobalExceptionHandler.class)
@WebMvcTest(AcademicSessionController.class)
class AcademicSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AcademicSessionService academicSessionService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnSessionsWithCurrentFlagWhenListingSessions() throws Exception {
        // Arrange
        AcademicSessionResponseDto currentSession = new AcademicSessionResponseDto(2L, "A2026", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 12, 31), true);
        AcademicSessionResponseDto pastSession = new AcademicSessionResponseDto(1L, "E2026", LocalDate.of(2026, 5, 1), LocalDate.of(2026, 8, 31), false);

        when(academicSessionService.getSessions()).thenReturn(List.of(currentSession, pastSession));

        // Act + Assert
        mockMvc.perform(get("/api/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("A2026"))
                .andExpect(jsonPath("$[0].current").value(true))
                .andExpect(jsonPath("$[1].current").value(false));
    }
}