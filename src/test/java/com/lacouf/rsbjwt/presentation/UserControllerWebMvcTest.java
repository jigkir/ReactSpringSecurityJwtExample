package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.service.UserAppService;
import com.lacouf.rsbjwt.service.dto.DisciplineDto;
import com.lacouf.rsbjwt.service.dto.LoginDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.hamcrest.Matchers.contains;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class UserControllerWebMvcTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private ObjectMapper objectMapper;

    @MockitoBean
    private UserAppService userService;

    @MockitoBean
    private GestionnaireRepository gestionnaireRepository;

    @MockitoBean
    private EmprunteurRepository emprunteurRepository;

    @MockitoBean
    private PreposeRepository preposeRepository;

    @MockitoBean
    private ManagerRepository managerRepository;

    @MockitoBean
    private UserAppRepository userAppRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /user/login returns 202 and token on success")
    void authenticateUser_success_returnsAcceptedAndToken() throws Exception {
        // Arrange
        LoginDTO login = new LoginDTO("user@example.com", "password");
        when(userService.authenticateUser(any(LoginDTO.class))).thenReturn("token123");

        // Act + Assert
        mockMvc.perform(post("/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isAccepted())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.tokenType").value("BEARER"))
                .andExpect(jsonPath("$.accessToken").value("token123"));
    }

    @Test
    @DisplayName("POST /user/login returns 401 on failure")
    void authenticateUser_failure_returnsUnauthorized() throws Exception {
        // Arrange
        LoginDTO login = new LoginDTO("user@example.com", "wrong");
        when(userService.authenticateUser(any(LoginDTO.class))).thenThrow(new RuntimeException("bad creds"));

        // Act + Assert
        mockMvc.perform(post("/user/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.tokenType").value("BEARER"))
                .andExpect(jsonPath("$.accessToken").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void shouldReturnAllDisciplines() throws Exception {
        // Arrange
        DisciplineDto disciplines = new DisciplineDto(
                List.of(
                    "COMPUTER_SCIENCE",
                    "CIVIL_ENGINEERING",
                    "ELECTRICAL_ENGINEERING",
                    "MARKETING",
                    "NURSING"
                ));

        when(userService.getAllDisciplines()).thenReturn(disciplines);

        // Act + Assert
        mockMvc.perform(get("/api/disciplines"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.disciplines",
                        contains(
                                "COMPUTER_SCIENCE",
                                "CIVIL_ENGINEERING",
                                "ELECTRICAL_ENGINEERING",
                                "MARKETING",
                                "NURSING"
                        )
                ));
    }
}
