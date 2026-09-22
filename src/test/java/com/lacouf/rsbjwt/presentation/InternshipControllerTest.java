package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.model.InternshipStatus;
import com.lacouf.rsbjwt.security.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.EmployerService;
import com.lacouf.rsbjwt.service.UserAppService;
import com.lacouf.rsbjwt.service.dto.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InternshipController.class)
@Import(GlobalExceptionHandler.class)
class InternshipControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private WebApplicationContext webApplicationContext;

    private ObjectMapper objectMapper;

    @MockitoBean
    private EmployerService employerService;

    @MockitoBean
    private UserAppService userAppService;

    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @WithMockUser(username = "email@example.com", authorities = "EMPLOYER")
    void shouldReturnCreatedWhenInternshipIsCreated() throws Exception {
        // Arrange
        InternshipResponseDto response = new InternshipResponseDto(10L, "Software Developer", "Develop applications", "Java Spring", "4 months", "Montreal", LocalDate.of(2027, 1, 10), LocalDate.of(2026, 12, 1), "25$/h", InternshipStatus.PENDING, false, 1L);

        when(employerService.save(any(InternshipRequestDto.class))).thenReturn(response);

        // Act + Assert
        mockMvc.perform(post("/api/internship/make")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "title": "Software Developer",
                                    "description": "Develop applications",
                                    "requiredSkills": "Java Spring",
                                    "duration": "4 months",
                                    "location": "Montreal",
                                    "startDate": "2027-01-10",
                                    "deadline": "2026-12-01",
                                    "compensation": "25$/h",
                                    "status": "PENDING",
                                    "isDeleted": false,
                                    "employerId": 1
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Software Developer"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.isDeleted").value(false))
                .andExpect(jsonPath("$.employerId").value(1));
    }

    @Test
    @WithMockUser(username = "email@example.com", authorities = "EMPLOYER")
    void shouldReturnNotFoundWhenCreatingInternshipForUnknownEmployer() throws Exception {
        // Arrange
        when(employerService.save(any(InternshipRequestDto.class))).thenThrow(new UserNotFoundException());

        // Act + Assert
        mockMvc.perform(post("/api/internship/make")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "title": "Software Developer",
                                    "description": "Develop applications",
                                    "requiredSkills": "Java Spring",
                                    "duration": "4 months",
                                    "location": "Montreal",
                                    "startDate": "2027-01-10",
                                    "deadline": "2026-12-01",
                                    "compensation": "25$/h",
                                    "status": "PENDING",
                                    "isDeleted": false,
                                    "employerId": 99
                                }
                                """))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @MethodSource("invalidInternshipFields")
    @WithMockUser(username = "email@example.com", authorities = "EMPLOYER")
    void shouldReturnBadRequestForInvalidInternshipFields(String field, Object invalidValue) throws Exception {
        // Arrange
        Map<String, Object> internship = new HashMap<>();
        internship.put("title", "Software Developer");
        internship.put("description", "Develop applications");
        internship.put("requiredSkills", "Java Spring");
        internship.put("duration", "4 months");
        internship.put("location", "Montreal");
        internship.put("startDate", "2027-01-10");
        internship.put("deadline", "2026-12-01");
        internship.put("compensation", "25$/h");
        internship.put("status", "PENDING");
        internship.put("isDeleted", false);
        internship.put("employerId", 1L);
        internship.put(field, invalidValue);

        // Act + Assert
        mockMvc.perform(post("/api/internship/make")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(internship)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(employerService);
    }

    static Stream<Arguments> invalidInternshipFields() {
        return Stream.of(
                Arguments.of("title", null),
                Arguments.of("title", ""),
                Arguments.of("title", " "),
                Arguments.of("title", "a"),
                Arguments.of("title", "a".repeat(51)),
                Arguments.of("description", null),
                Arguments.of("description", ""),
                Arguments.of("description", " "),
                Arguments.of("description", "a"),
                Arguments.of("description", "a".repeat(256)),
                Arguments.of("requiredSkills", null),
                Arguments.of("requiredSkills", ""),
                Arguments.of("requiredSkills", " "),
                Arguments.of("duration", null),
                Arguments.of("duration", ""),
                Arguments.of("duration", " "),
                Arguments.of("location", null),
                Arguments.of("location", ""),
                Arguments.of("location", " "),
                Arguments.of("startDate", null),
                Arguments.of("startDate", ""),
                Arguments.of("startDate", " "),
                Arguments.of("deadline", null),
                Arguments.of("deadline", ""),
                Arguments.of("deadline", " "),
                Arguments.of("compensation", null),
                Arguments.of("compensation", ""),
                Arguments.of("compensation", " ")
        );
    }

    @Test
    @WithMockUser(username = "email@example.com", authorities = "EMPLOYER")
    void shouldReturnOkWhenInternshipIsDeleted() throws Exception {
        // Arrange
        InternshipResponseDto response = new InternshipResponseDto(10L, "Software Developer", "Develop applications", "Java Spring", "4 months", "Montreal", LocalDate.of(2027, 1, 10), LocalDate.of(2026, 12, 1), "25$/h", InternshipStatus.PENDING, true, 1L);
        when(employerService.deleteInternship(10L)).thenReturn(response);

        // Act + Assert
        mockMvc.perform(put("/api/internship/delete").param("id", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.isDeleted").value(true));
    }

    @Test
    @WithMockUser(username = "email@example.com", authorities = "EMPLOYER")
    void shouldReturnInternshipsMadeByCurrentEmployer() throws Exception {
        // Arrange
        UserResponseDto user = new UserResponseDto(1L, "First Name", "Last Name", "email@example.com", "EMPLOYER");
        InternshipResponseDto internship = new InternshipResponseDto(10L, "Software Developer", "Develop applications", "Java Spring", "4 months", "Montreal", LocalDate.of(2027, 1, 10), LocalDate.of(2026, 12, 1), "25$/h", InternshipStatus.PENDING, false, 1L);

        when(userAppService.getUserByEmail("email@example.com")).thenReturn(user);
        when(employerService.getInternshipsByEmployerId(1L)).thenReturn(List.of(internship));

        // Act + Assert
        mockMvc.perform(get("/api/internship/made")
                        .principal(Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Software Developer"));

        verify(employerService).getInternshipsByEmployerId(1L);
    }

    @Test
    @WithMockUser(username = "student@example.com", authorities = "STUDENT")
    void shouldReturnAllActiveInternships() throws Exception {
        // Arrange
        InternshipResponseDto internship = new InternshipResponseDto(10L, "Software Developer", "Develop applications", "Java Spring", "4 months", "Montreal", LocalDate.of(2027, 1, 10), LocalDate.of(2026, 12, 1), "25$/h", InternshipStatus.PENDING, false, 1L);
        when(employerService.getAllActiveInternships()).thenReturn(List.of(internship));

        // Act + Assert
        mockMvc.perform(get("/api/internship/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Software Developer"))
                .andExpect(jsonPath("$[0].isDeleted").value(false));

        verify(employerService).getAllActiveInternships();
    }
}