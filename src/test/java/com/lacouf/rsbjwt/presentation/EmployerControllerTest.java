package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.model.InternshipStatus;
import com.lacouf.rsbjwt.security.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.security.exception.UserNotFoundException;
import com.lacouf.rsbjwt.service.EmployerService;
import com.lacouf.rsbjwt.service.dto.EmployerSignUpDto;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EmployerController.class)
@Import(GlobalExceptionHandler.class)
public class EmployerControllerTest {

    @Autowired
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        authentication = new UsernamePasswordAuthenticationToken(EMPLOYER_EMAIL, null);
    }

    @MockitoBean
    private EmployerService employerService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    private static final String EMPLOYER_EMAIL = "employer@example.com";
    private static final LocalDate START_DATE = LocalDate.now().plusMonths(4);
    private static final LocalDate APPLICATION_DEADLINE = LocalDate.now().plusMonths(2);

    private static Map<String, Object> validInternship() {
        return new HashMap<>(Map.of("title", "Software Developer", "description", "Develop applications", "requiredSkills", "Java, Spring", "durationInWeeks", "P16W", "location", "Montreal", "startDate", START_DATE.toString(), "applicationDeadline", APPLICATION_DEADLINE.toString(), "compensationAmount", 25.00, "compensationNegotiable", false));
    }

    private static InternshipResponseDto internshipResponse() {
        return new InternshipResponseDto(10L, "Software Developer", "Develop applications", "Java, Spring", Period.ofWeeks(16), "Montreal", START_DATE, APPLICATION_DEADLINE, new BigDecimal("25.00"), false, InternshipStatus.PENDING, 1L);
    }

    @Test
    void shouldReturnCreatedWhenEmployerSignsUp() throws Exception {
        // Arrange
        UserResponseDto employerCreationResponse = new UserResponseDto(
                1L, "George", "Hudubulla", "email@email.com", "EMPLOYER"
        );

        when(employerService.save(any(EmployerSignUpDto.class))).thenReturn(employerCreationResponse);

        // Act + Assert
        mockMvc.perform(post("/api/employer/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "firstName": "George",
                                "lastName": "Hudubulla",
                                "email": "email@email.com",
                                "password": "Password123@",
                                "companyName": "Tech Corp",
                                "discipline": "COMPUTER_SCIENCE",
                                "phoneNumber": "5550199999"
                            }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("George"))
                .andExpect(jsonPath("$.lastName").value("Hudubulla"))
                .andExpect(jsonPath("$.email").value("email@email.com"))
                .andExpect(jsonPath("$.role").value("EMPLOYER"));
    }

    @Test
    void shouldReturnConflictWhenEmployerAlreadyExists() throws Exception {
        // Arrange
        when(employerService.save(any(EmployerSignUpDto.class)))
                .thenThrow(new UserAlreadyExistsException("email"));

        // Act + Assert
        mockMvc.perform(post("/api/employer/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "firstName": "George",
                                "lastName": "Hudubulla",
                                "email": "email@email.com",
                                "password": "Password123@",
                                "companyName": "Tech Corp",
                                "discipline": "COMPUTER_SCIENCE",
                                "phoneNumber": "5550199999"
                            }
                            """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("user already exists"))
                .andExpect(jsonPath("$.field").value("email"));
    }

    @ParameterizedTest
    @MethodSource("invalidFields")
    void shouldReturnBadRequestForInvalidFields(String field, Object invalidValue) throws Exception {
        // Arrange
        Map<String, Object> employer = new HashMap<>();
        employer.put("firstName", "George");
        employer.put("lastName", "Hudubulla");
        employer.put("email", "email@email.com");
        employer.put("password", "Password123@");
        employer.put("companyName", "Tech Corp");
        employer.put("discipline", "COMPUTER_SCIENCE");
        employer.put("phoneNumber", "5550199999");

        employer.put(field, invalidValue);

        // Act + Assert
        mockMvc.perform(post("/api/employer/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(employer)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(employerService);
    }

    static Stream<Arguments> invalidFields() {
        return Stream.of(
                Arguments.of("firstName", null),
                Arguments.of("firstName", ""),
                Arguments.of("firstName", "   "),
                Arguments.of("firstName", "a"),
                Arguments.of("firstName", "a".repeat(51)),

                Arguments.of("lastName", null),
                Arguments.of("lastName", ""),
                Arguments.of("lastName", "   "),
                Arguments.of("lastName", "a"),
                Arguments.of("lastName", "a".repeat(51)),

                Arguments.of("email", null),
                Arguments.of("email", ""),
                Arguments.of("email", "   "),
                Arguments.of("email", "invalid-email"),
                Arguments.of("email", "email@"),

                Arguments.of("password", null),
                Arguments.of("password", ""),
                Arguments.of("password", "   "),
                Arguments.of("password", "password"),
                Arguments.of("password", "Password123"),
                Arguments.of("password", "Password@"),

                Arguments.of("companyName", null),
                Arguments.of("companyName", ""),
                Arguments.of("companyName", "   "),
                Arguments.of("companyName", "a"),
                Arguments.of("companyName", "a".repeat(101)),

                Arguments.of("phoneNumber", null),
                Arguments.of("phoneNumber", ""),
                Arguments.of("phoneNumber", "   "),
                Arguments.of("phoneNumber", "123456789"),
                Arguments.of("phoneNumber", "1".repeat(21))
        );
    }

    @Test
    void shouldReturnCreatedWhenInternshipIsCreated() throws Exception {
        // Arrange
        when(employerService.saveInternship(any(InternshipRequestDto.class), eq(EMPLOYER_EMAIL))).thenReturn(internshipResponse());

        // Act + Assert
        mockMvc.perform(post("/api/employer/internship").principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validInternship())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Software Developer"))
                .andExpect(jsonPath("$.location").value("Montreal"))
                .andExpect(jsonPath("$.compensationNegotiable").value(false))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.employerId").value(1));

        verify(employerService).saveInternship(any(InternshipRequestDto.class), eq(EMPLOYER_EMAIL));
    }

    @Test
    void shouldReturnNotFoundWhenCreatingInternshipForUnknownEmployer() throws Exception {
        // Arrange
        when(employerService.saveInternship(any(InternshipRequestDto.class), eq(EMPLOYER_EMAIL))).thenThrow(new UserNotFoundException());

        // Act + Assert
        mockMvc.perform(post("/api/employer/internships").principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validInternship())))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @MethodSource("invalidInternshipFields")
    void shouldReturnBadRequestForInvalidInternshipFields(String field, Object invalidValue) throws Exception {
        // Arrange
        Map<String, Object> internship = validInternship();
        internship.put(field, invalidValue);

        // Act + Assert
        mockMvc.perform(post("/api/employer/internship")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(internship)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(employerService);
    }

    static Stream<Arguments> invalidInternshipFields() {
        return Stream.of(
                Arguments.of("title", null),
                Arguments.of("title", ""),
                Arguments.of("title", "   "),
                Arguments.of("title", "a"),
                Arguments.of("title", "a".repeat(51)),

                Arguments.of("description", null),
                Arguments.of("description", ""),
                Arguments.of("description", "   "),
                Arguments.of("description", "a"),

                Arguments.of("requiredSkills", null),
                Arguments.of("requiredSkills", ""),
                Arguments.of("requiredSkills", "   "),
                Arguments.of("requiredSkills", "a"),

                Arguments.of("durationInWeeks", null),
                Arguments.of("durationInWeeks", "4 months"),

                Arguments.of("location", null),
                Arguments.of("location", ""),
                Arguments.of("location", "   "),
                Arguments.of("location", "a"),

                Arguments.of("startDate", null),
                Arguments.of("startDate", "2020-01-01"),
                Arguments.of("startDate", "not-a-date"),

                Arguments.of("applicationDeadline", null),
                Arguments.of("applicationDeadline", "2020-01-01"),
                Arguments.of("applicationDeadline", "not-a-date"),

                Arguments.of("compensationAmount", null),
                Arguments.of("compensationAmount", 123.45),
                Arguments.of("compensationAmount", 12.345),
                Arguments.of("compensationAmount", "abc")
        );
    }

    @Test
    void shouldReturnNoContentWhenInternshipIsDeleted() throws Exception {
        // Act + Assert
        mockMvc.perform(delete("/api/employer/internships/10").principal(authentication))
                .andExpect(status().isNoContent());

        verify(employerService).deleteInternship(10L, EMPLOYER_EMAIL);
    }

    @Test
    void shouldReturnInternshipsOfEmployer() throws Exception {
        // Arrange
        when(employerService.getInternshipsByEmployerId(1L)).thenReturn(List.of(internshipResponse()));

        // Act + Assert
        mockMvc.perform(get("/api/employer/1/internships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Software Developer"))
                .andExpect(jsonPath("$[0].employerId").value(1));

        verify(employerService).getInternshipsByEmployerId(1L);
    }
}