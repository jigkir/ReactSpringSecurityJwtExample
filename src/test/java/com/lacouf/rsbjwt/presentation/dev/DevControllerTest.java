package com.lacouf.rsbjwt.presentation.dev;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadySignedException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import com.lacouf.rsbjwt.service.dto.response.auth.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.users.ManagerService;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(GlobalExceptionHandler.class)
@WebMvcTest(DevController.class)
public class DevControllerTest {
    private static final String MANAGER_EMAIL = "gestion.stages@claurendeau.qc.ca";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserAppService userAppService;
    @MockitoBean
    private ManagerService managerService;

    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnAllUsers() throws Exception {
        // Arrange
        when(userAppService.getAllDevUsers()).thenReturn(List.of(
                new UserResponseDto(1L, "John", "Doe", "student@example.com", "STUDENT", Discipline.COMPUTER_SCIENCE),
                new UserResponseDto(2L, "Jane", "Doe", "manager@example.com", "MANAGER", null)
        ));

        // Act + Assert
        mockMvc.perform(get("/api/dev/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].email").value("student@example.com"))
                .andExpect(jsonPath("$[0].role").value("STUDENT"))
                .andExpect(jsonPath("$[0].discipline").value("COMPUTER_SCIENCE"))
                .andExpect(jsonPath("$[1].email").value("manager@example.com"))
                .andExpect(jsonPath("$[1].role").value("MANAGER"))
                .andExpect(jsonPath("$[1].discipline").doesNotExist());

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

    @Test
    void shouldSignContractAsManagerWithoutPasswordWhenDevSigning() throws Exception {
        // Arrange
        ContractResponseDto signedContract = new ContractResponseDto(30L, null, null, "Marie Tremblay", "Jean Dupont", "Tech Corp", "John Doe", LocalDateTime.of(2026, 11, 10, 14, 30), null, null, LocalDateTime.of(2026, 11, 11, 9, 0));

        when(managerService.devSignContract(MANAGER_EMAIL, 30L)).thenReturn(signedContract);

        // Act + Assert
        mockMvc.perform(put("/api/dev/contracts/30/manager-signature").param("email", MANAGER_EMAIL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managerSignedAt").value("2026-11-11T09:00:00"));
    }

    @Test
    void shouldReturnConflictWhenDevSigningContractAlreadySignedByManager() throws Exception {
        // Arrange
        when(managerService.devSignContract(MANAGER_EMAIL, 30L)).thenThrow(new ContractAlreadySignedException(30L, ContractParty.MANAGER));

        // Act + Assert
        mockMvc.perform(put("/api/dev/contracts/30/manager-signature").param("email", MANAGER_EMAIL))
                .andExpect(status().isConflict());
    }
}