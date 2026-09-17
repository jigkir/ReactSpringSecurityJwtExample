package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.security.exception.RestExceptionHandler;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.EmployerService;
import com.lacouf.rsbjwt.service.dto.EmployerSignUpDto;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EmployerController.class)
@Import(RestExceptionHandler.class)
public class EmployerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @MockitoBean
    private EmployerService employerService;

    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

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
                .thenThrow(new UserAlreadyExistsException());

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
                .andExpect(jsonPath("$.message").value("user already exists"));
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
}