package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.application.InternshipApplicationStatus;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.presentation.users.EmployerController;
import com.lacouf.rsbjwt.service.dto.request.interview.InterviewRequestDto;
import com.lacouf.rsbjwt.service.dto.response.interview.InterviewEmployerResponseDTO;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.request.signup.EmployerSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.application.ReceivedInternshipApplicationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentSummaryDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.users.EmployerService;
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
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EmployerController.class)
@Import(GlobalExceptionHandler.class)
public class EmployerControllerTest {

    private static final String EMPLOYER_EMAIL = "employer@example.com";
    private static final LocalDate START_DATE = LocalDate.now().plusMonths(4);
    private static final LocalDate APPLICATION_DEADLINE = LocalDate.now().plusMonths(2);

    @Autowired
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private Authentication authentication;

    @MockitoBean
    private EmployerService employerService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    private static Map<String, Object> validInternship() {
        return new HashMap<>(Map.of("title", "Software Developer", "description", "Develop applications", "requiredSkills", "Java, Spring", "durationInWeeks", 16, "location", "Montreal", "workMode", "HYBRID", "startDate", START_DATE.toString(), "applicationDeadline", APPLICATION_DEADLINE.toString(), "compensationAmount", 25.00, "compensationNegotiable", false));
    }

    private static InternshipResponseDto internshipResponse() {
        return new InternshipResponseDto(10L, "Software Developer", "Develop applications", "Java, Spring", 16, "Montreal", WorkMode.HYBRID, START_DATE, APPLICATION_DEADLINE, new BigDecimal("25.00"), false, ReviewStatus.PENDING, "it sucks", 1L, "employer@example.com", Discipline.COMPUTER_SCIENCE, LocalDateTime.now(), false);
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

                Arguments.of("durationInWeeks", 0),
                Arguments.of("durationInWeeks", -3),

                Arguments.of("location", null),
                Arguments.of("location", ""),
                Arguments.of("location", "   "),
                Arguments.of("location", "a"),

                Arguments.of("startDate", null),
                Arguments.of("startDate", "not-a-date"),

                Arguments.of("applicationDeadline", null),
                Arguments.of("applicationDeadline", "not-a-date"),

                Arguments.of("compensationAmount", -5),
                Arguments.of("compensationAmount", 12.345),
                Arguments.of("compensationAmount", "abc")
        );
    }

    static Stream<Arguments> invalidInterviewFields() {
        return Stream.of(
                Arguments.of("message", null),
                Arguments.of("message", ""),
                Arguments.of("message", "   "),
                Arguments.of("message", "a"),
                Arguments.of("message", "a".repeat(501)),

                Arguments.of("interviewDate", null),
                Arguments.of("interviewDate", "not-a-date"),
                Arguments.of("interviewDate", LocalDateTime.now().minusDays(1).toString())
        );
    }

    private static Map<String, Object> validInterview() {
        return new HashMap<>(Map.of(
                "message", "Please come to our office",
                "interviewDate", LocalDateTime.now().plusDays(7).toString()
        ));
    }

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        authentication = new UsernamePasswordAuthenticationToken(EMPLOYER_EMAIL, null);
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
    void shouldReturnCreatedWhenCompensationAmountIsAbove100() throws Exception {
        // Arrange: there is no maximum compensation anymore
        Map<String, Object> internship = validInternship();
        internship.put("compensationAmount", 12345.67);

        when(employerService.saveInternship(any(InternshipRequestDto.class), eq(EMPLOYER_EMAIL))).thenReturn(internshipResponse());

        // Act + Assert
        mockMvc.perform(post("/api/employer/internship").principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(internship)))
                .andExpect(status().isCreated());

        verify(employerService).saveInternship(any(InternshipRequestDto.class), eq(EMPLOYER_EMAIL));
    }

    @Test
    void shouldReturnNotFoundWhenCreatingInternshipForUnknownEmployer() throws Exception {
        // Arrange
        when(employerService.saveInternship(any(InternshipRequestDto.class), eq(EMPLOYER_EMAIL))).thenThrow(new UserNotFoundException());

        // Act + Assert
        mockMvc.perform(post("/api/employer/internship").principal(authentication)
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
        when(employerService.getInternshipsOfEmployer(EMPLOYER_EMAIL)).thenReturn(List.of(internshipResponse()));

        // Act + Assert
        mockMvc.perform(get("/api/employer/internships").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Software Developer"))
                .andExpect(jsonPath("$[0].employerId").value(1));

        verify(employerService).getInternshipsOfEmployer(EMPLOYER_EMAIL);
    }

    @Test
    void shouldReturnReceivedInternshipApplications() throws Exception {
        // Arrange
        StudentSummaryDto student = new StudentSummaryDto(3L, "Jane", "Doe", "student@example.com", "1234567", Discipline.COMPUTER_SCIENCE);
        ReceivedInternshipApplicationResponseDto receivedInternshipApplication = new ReceivedInternshipApplicationResponseDto(20L, 10L, "Software Developer", student, 5L, "cv.pdf", LocalDate.now(), InternshipApplicationStatus.UNREAD);

        when(employerService.getReceivedInternshipApplications(EMPLOYER_EMAIL)).thenReturn(List.of(receivedInternshipApplication));

        // Act + Assert
        mockMvc.perform(get("/api/employer/applications").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].student.email").value("student@example.com"))
                .andExpect(jsonPath("$[0].internshipApplicationStatus").value("UNREAD"));
    }

    @Test
    void shouldReturnCvWhenEmployerOpensApplicationCv() throws Exception {
        // Arrange
        when(employerService.openReceivedInternshipApplicationCv(20L, EMPLOYER_EMAIL)).thenReturn(new CvFileResponseDto(5L, "cv.pdf", new byte[]{1}));

        // Act + Assert
        mockMvc.perform(get("/api/employer/applications/20/cv").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("cv.pdf"));
    }

    @Test
    void shouldReturnInternshipApplicationCounts() throws Exception {
        // Arrange
        when(employerService.countReceivedInternshipApplicationsByInternship(EMPLOYER_EMAIL)).thenReturn(Map.of(10L, 2L));

        // Act + Assert
        mockMvc.perform(get("/api/employer/applications/count").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$['10']").value(2));
    }

    @Test
    void shouldReturnOkWhenInterviewIsCreated() throws Exception {
        // Act + Assert
        mockMvc.perform(post("/api/employer/applications/20/accept").principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validInterview())))
                .andExpect(status().isOk());

        verify(employerService).createInterview(eq(20L), eq(EMPLOYER_EMAIL), any(InterviewRequestDto.class));
    }

    @ParameterizedTest
    @MethodSource("invalidInterviewFields")
    void shouldReturnBadRequestForInvalidInterviewFields(String field, Object invalidValue) throws Exception {
        // Arrange
        Map<String, Object> interview = validInterview();
        interview.put(field, invalidValue);

        // Act + Assert
        mockMvc.perform(post("/api/employer/applications/20/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(interview)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(employerService);
    }

    @Test
    void shouldReturnNotFoundWhenCreatingInterviewForUnknownApplication() throws Exception {
        // Arrange
        doThrow(new InternshipApplicationNotFoundException(20L))
                .when(employerService).createInterview(eq(20L), eq(EMPLOYER_EMAIL), any(InterviewRequestDto.class));

        // Act + Assert
        mockMvc.perform(post("/api/employer/applications/20/accept").principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validInterview())))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnInterviewsOfEmployer() throws Exception {
        // Arrange
        InterviewEmployerResponseDTO interview = new InterviewEmployerResponseDTO(
                30L, "Jane Doe", "Software Developer", "Please come to our office", "PENDING", "2026-11-01T14:30");

        when(employerService.getInterviewsOfEmployer(EMPLOYER_EMAIL)).thenReturn(List.of(interview));

        // Act + Assert
        mockMvc.perform(get("/api/employer/interviews").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(30))
                .andExpect(jsonPath("$[0].studentName").value("Jane Doe"))
                .andExpect(jsonPath("$[0].internshipTitle").value("Software Developer"))
                .andExpect(jsonPath("$[0].studentDecision").value("PENDING"))
                .andExpect(jsonPath("$[0].interviewDate").value("2026-11-01T14:30"));

        verify(employerService).getInterviewsOfEmployer(EMPLOYER_EMAIL);
    }
}