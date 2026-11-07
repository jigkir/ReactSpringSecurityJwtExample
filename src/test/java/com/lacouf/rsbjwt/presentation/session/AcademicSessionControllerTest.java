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
    void shouldReturnSessionsWithTargetFlagWhenListingSessions() throws Exception {
        // Arrange
        AcademicSessionResponseDto targetSession = new AcademicSessionResponseDto(2L, "H2027", LocalDate.of(2027, 1, 1), LocalDate.of(2027, 5, 31), true);
        AcademicSessionResponseDto pastSession = new AcademicSessionResponseDto(1L, "H2026", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 5, 31), false);

        when(academicSessionService.getSessions()).thenReturn(List.of(targetSession, pastSession));

        // Act + Assert
        mockMvc.perform(get("/api/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("H2027"))
                .andExpect(jsonPath("$[0].target").value(true))
                .andExpect(jsonPath("$[1].target").value(false));
    }
}