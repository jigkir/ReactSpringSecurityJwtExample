package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.UserAppService;
import com.lacouf.rsbjwt.service.dto.DisciplineDto;
import com.lacouf.rsbjwt.service.dto.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.UserLoginDTO;
import com.lacouf.rsbjwt.service.dto.RoleDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
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
    private ManagerService managerService;

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
    void shouldReturnTokenWhenLoginSucceeds() throws Exception {
        // Arrange
        UserLoginDTO login = new UserLoginDTO("user@example.com", "password");
        when(userService.login(any(UserLoginDTO.class))).thenReturn(new JWTAuthResponse("token123"));

        // Act + Assert
        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.tokenType").value("BEARER"))
                .andExpect(jsonPath("$.accessToken").value("token123"));
    }

    @Test
    void shouldReturnUnauthorizedWhenCredentialsAreInvalid() throws Exception {
        // Arrange
        UserLoginDTO login = new UserLoginDTO("user@example.com", "Password123@");
        when(userService.login(any(UserLoginDTO.class))).thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act + Assert
        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
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

    @Test
    void shouldReturnAllRoles() throws Exception {
        // Arrange
        RoleDto roles = new RoleDto(
                List.of(
                        "MANAGER",
                        "PREPOSE",
                        "EMPRUNTEUR",
                        "STUDENT",
                        "EMPLOYER"
                ));

        when(userService.getAllRoles()).thenReturn(roles);

        // Act + Assert
        mockMvc.perform(get("/api/roles"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.roles",
                        contains(
                                "MANAGER",
                                "PREPOSE",
                                "EMPRUNTEUR",
                                "STUDENT",
                                "EMPLOYER"
                        )
                ));
    }
}
