package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.presentation.dev.DevController;
import com.lacouf.rsbjwt.service.dto.response.auth.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(GlobalExceptionHandler.class)
@WebMvcTest(DevController.class)
public class DevControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserAppService userAppService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnAllUsers() throws Exception {
        // Arrange
        when(userAppService.getAllDevUsers()).thenReturn(List.of(
                new UserResponseDto(1L, "John", "Doe", "student@example.com", "STUDENT"),
                new UserResponseDto(2L, "Jane", "Doe", "manager@example.com", "MANAGER")
        ));

        // Act + Assert
        mockMvc.perform(get("/api/dev/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].email").value("student@example.com"))
                .andExpect(jsonPath("$[0].role").value("STUDENT"))
                .andExpect(jsonPath("$[1].email").value("manager@example.com"))
                .andExpect(jsonPath("$[1].role").value("MANAGER"));

        verify(userAppService).getAllDevUsers();
    }

    @Test
    void shouldReturnEmptyListWhenNoUsers() throws Exception {
        // Arrange
        when(userAppService.getAllDevUsers()).thenReturn(List.of());

        // Act + Assert
        mockMvc.perform(get("/api/dev/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldReturnTokenWhenLoginAsExistingUser() throws Exception {
        // Arrange
        when(userAppService.devLoginAs("student@example.com")).thenReturn(new JWTAuthResponse("dev-token"));

        // Act + Assert
        mockMvc.perform(post("/api/dev/login-as").param("email", "student@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("BEARER"))
                .andExpect(jsonPath("$.accessToken").value("dev-token"));

        verify(userAppService).devLoginAs("student@example.com");
    }

    @Test
    void shouldReturnNotFoundWhenLoginAsUnknownUser() throws Exception {
        // Arrange
        when(userAppService.devLoginAs("unknown@example.com")).thenThrow(new UserNotFoundException());

        // Act + Assert
        mockMvc.perform(post("/api/dev/login-as").param("email", "unknown@example.com"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("userNotFound"));
    }

    @Test
    void shouldReturnBadRequestWhenEmailParamIsMissing() throws Exception {
        // Act + Assert
        mockMvc.perform(post("/api/dev/login-as"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(userAppService);
    }
}