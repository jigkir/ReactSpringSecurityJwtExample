package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.repository.*;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.TeacherService;
import com.lacouf.rsbjwt.service.dto.TeacherSignUpDto;
import com.lacouf.rsbjwt.service.dto.UserResponseDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@WebMvcTest(TeacherController.class)
public class TeacherControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @MockitoBean
    private TeacherService teacherService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnCreatedWhenTeacherSignsUp() throws Exception {
        // Arrange
        UserResponseDto teacherCreationResponse = new UserResponseDto(1L, "First Name", "Last Name", "test@claurendeau.qc.ca", "TEACHER");

        when(teacherService.save(any(TeacherSignUpDto.class))).thenReturn(teacherCreationResponse);

        // Act & Assert
        mockMvc.perform(post("/api/teacher/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "firstName": "First Name",
                                "lastName": "Last Name",
                                "teacherId": "12345",
                                "email": "test@claurendeau.qc.ca",
                                "password": "Test123@",
                                "discipline": "COMPUTER_SCIENCE"
                            }
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("First Name"))
                .andExpect(jsonPath("$.lastName").value("Last Name"))
                .andExpect(jsonPath("$.email").value("test@claurendeau.qc.ca"))
                .andExpect(jsonPath("$.role").value("TEACHER"));
    }

    @ParameterizedTest
    @MethodSource("teacherConflictFields")
    void shouldReturnConflictWhenTeacherAlreadyExists(String conflictField) throws Exception {
        // Arrange
        when(teacherService.save(any(TeacherSignUpDto.class))).thenThrow(new UserAlreadyExistsException(conflictField));

        // Act & Assert
        mockMvc.perform(post("/api/teacher/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                        {
                            "firstName": "First Name",
                            "lastName": "Last Name",
                            "teacherId": "12345",
                            "email": "test@claurendeau.qc.ca",
                            "password": "Test123@",
                            "discipline": "COMPUTER_SCIENCE"
                        }
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("user already exists"))
                .andExpect(jsonPath("$.field").value(conflictField));
    }

    static Stream<Arguments> teacherConflictFields() {
        return Stream.of(
                Arguments.of("email"),
                Arguments.of("teacherId")
        );
    }

    @ParameterizedTest
    @MethodSource("invalidFields")
    void shouldReturnBadRequestForInvalidFields(String field, Object invalidValue) throws Exception {
        // Arrange
        Map<String, Object> teacher = new HashMap<>();

        teacher.put("firstName", "First Name");
        teacher.put("lastName", "Last Name");
        teacher.put("teacherId", "12345");
        teacher.put("email", "test@claurendeau.qc.ca");
        teacher.put("password", "Test123@");
        teacher.put("discipline", "COMPUTER_SCIENCE");

        teacher.put(field, invalidValue);

        // Act & Assert
        mockMvc.perform(post("/api/teacher/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacher)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(teacherService);
    }

    static Stream<Arguments> invalidFields() {
        return Stream.of(
                Arguments.of("firstName", ""),
                Arguments.of("firstName", "f"),
                Arguments.of("firstName", "f".repeat(51)),
                Arguments.of("lastName", ""),
                Arguments.of("lastName", "l"),
                Arguments.of("lastName", "l".repeat(51)),
                Arguments.of("teacherId", "no-digits"),
                Arguments.of("teacherId", "1".repeat(21)),
                Arguments.of("email", "invalid-email"),
                Arguments.of("email", "e".repeat(91) + "@gmail.com"),
                Arguments.of("password", "test"),
                Arguments.of("password", "Test100"),
                Arguments.of("password", "Test10@"),
                Arguments.of("password", "Test10@" + "@".repeat(44)),
                Arguments.of("discipline", null)
        );
    }
}
