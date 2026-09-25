package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.security.exception.UserAlreadyExistsException;
import com.lacouf.rsbjwt.service.StudentService;
import com.lacouf.rsbjwt.service.dto.StudentSignUpDto;
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
import com.lacouf.rsbjwt.security.exception.*;
import com.lacouf.rsbjwt.service.dto.CVDto;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;


@WebMvcTest(StudentController.class)
public class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;
    private Student dummyStudent;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        dummyStudent = new Student(
                "First Name", "Last Name", "1234567",
                Credentials.builder().email("test@claurendeau.qc.ca").role(Role.STUDENT).build(),
                Discipline.COMPUTER_SCIENCE
        );
        dummyStudent.setId(1L);
    }

    @MockitoBean
    private StudentService studentService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnCreatedWhenStudentSignsUp() throws Exception {
        // Arrange
        UserResponseDto studentCreationResponse = new UserResponseDto(1L, "First Name", "Last Name", "test@claurendeau.qc.ca", "STUDENT");

        when(studentService.save(any(StudentSignUpDto.class))).thenReturn(studentCreationResponse);

        // Act & Assert
        mockMvc.perform(post("/api/student/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                                "firstName": "First Name",
                                "lastName": "Last Name",
                                "studentId": "1234567",
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
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @ParameterizedTest
    @MethodSource("studentConflictFields")
    void shouldReturnConflictWhenStudentAlreadyExists(String conflictField) throws Exception {
        // Arrange
        when(studentService.save(any(StudentSignUpDto.class))).thenThrow(new UserAlreadyExistsException(conflictField));

        // Act & Assert
        mockMvc.perform(post("/api/student/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                        {
                            "firstName": "First Name",
                            "lastName": "Last Name",
                            "studentId": "1234567",
                            "email": "test@claurendeau.qc.ca",
                            "password": "Test123@",
                            "discipline": "COMPUTER_SCIENCE"
                        }
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("user already exists"))
                .andExpect(jsonPath("$.field").value(conflictField));
    }

    static Stream<Arguments> studentConflictFields() {
        return Stream.of(
                Arguments.of("email"),
                Arguments.of("studentId")
        );
    }

    @ParameterizedTest
    @MethodSource("invalidFields")
    void shouldReturnBadRequestForInvalidFields(String field, Object invalidValue) throws Exception {
        // Arrange
        Map<String, Object> student = new HashMap<>();

        student.put("firstName", "First Name");
        student.put("lastName", "Last Name");
        student.put("studentId", "1234567");
        student.put("email", "test@claurendeau.qc.ca");
        student.put("password", "Test123@");
        student.put("discipline", "COMPUTER_SCIENCE");

        student.put(field, invalidValue);

        // Act & Assert
        mockMvc.perform(post("/api/student/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(studentService);
    }

    static Stream<Arguments> invalidFields() {
        return Stream.of(
                Arguments.of("firstName", ""),
                Arguments.of("firstName", "f"),
                Arguments.of("firstName", "f".repeat(51)),
                Arguments.of("lastName", ""),
                Arguments.of("lastName", "l"),
                Arguments.of("lastName", "l".repeat(51)),
                Arguments.of("studentId", "no-digits"),
                Arguments.of("studentId", "1".repeat(21)),
                Arguments.of("email", "invalid-email"),
                Arguments.of("email", "e".repeat(91) + "@gmail.com"),
                Arguments.of("password", "test"),
                Arguments.of("password", "Test100"),
                Arguments.of("password", "Test10@"),
                Arguments.of("password", "Test100@   "),
                Arguments.of("password", "Test10@" + "@".repeat(44)),
                Arguments.of("discipline", null)
        );
    }

    @Test
    void shouldGetStudentCVsSuccessfully() throws Exception {
        CVDto cvDto = new CVDto("PDF Content".getBytes(), 10L, CVSharingScope.PRIVATE, "my_cv.pdf", 11L, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE);
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        when(studentService.getCVs(dummyStudent)).thenReturn(List.of(cvDto));

        mockMvc.perform(get("/api/student/1/cvs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].fileName").value("my_cv.pdf"))
                .andExpect(jsonPath("$[0].sharingScope").value("PRIVATE"))
                .andExpect(jsonPath("$[0].visibility").value(CvVisibility.VISIBLE.name()));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCVsForNonExistentStudent() throws Exception {
        when(studentService.findById(99L)).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/student/99/cvs"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldGetCVCountSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        when(studentService.getCVCountByStudent(dummyStudent)).thenReturn(3L);

        mockMvc.perform(get("/api/student/1/cvs/count"))
                .andExpect(status().isOk())
                .andExpect(content().string("3"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCVCountForNonExistentStudent() throws Exception {
        when(studentService.findById(99L)).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/student/99/cvs/count"))
                .andExpect(status().isNotFound());
    }


    // Hide, Make Public & Make Private CV Tests


    @Test
    void shouldHideCVSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCvAsInvisible(dummyStudent, 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/hide"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV hidden successfully"));

        verify(studentService).setCvAsInvisible(dummyStudent, 10L);
    }

    @Test
    void shouldReturnNotFoundWhenHidingCVForNonExistentStudent() throws Exception {
        when(studentService.findById(99L)).thenThrow(new UserNotFoundException());

        mockMvc.perform(put("/api/student/99/cvs/10/hide"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldMakeCVPublicSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCvAsPublic(dummyStudent, 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/public"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made public successfully"));

        verify(studentService).setCvAsPublic(dummyStudent, 10L);
    }

    @Test
    void shouldReturnConflictWhenCVAlreadyPublic() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doThrow(new CVAlreadyPublicException("CV is already public")).when(studentService).setCvAsPublic(dummyStudent, 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/public"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldMakeCVPrivateSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCvAsPrivate(dummyStudent, 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/private"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made private successfully"));

        verify(studentService).setCvAsPrivate(dummyStudent, 10L);
    }

    @Test
    void shouldReturnConflictWhenCVAlreadyPrivate() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doThrow(new CVAlredyPrivateException("CV is already private")).when(studentService).setCvAsPrivate(dummyStudent, 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/private"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldMakeCVSecondarySuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCVAsSecondary(dummyStudent, 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/secondary"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made secondary successfully"));

        verify(studentService).setCVAsSecondary(dummyStudent, 10L);
    }

    @Test
    void shouldReturnNotFoundWhenMakingCVSecondaryForNonExistentStudent() throws Exception {
        when(studentService.findById(99L)).thenThrow(new UserNotFoundException());

        mockMvc.perform(put("/api/student/99/cvs/10/secondary"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenMakingSecondaryForNonExistentCv() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doThrow(new CvNotFoundException("CV not found")).when(studentService).setCVAsSecondary(dummyStudent, 999L);

        mockMvc.perform(put("/api/student/1/cvs/999/secondary"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldMakeCVMainSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCVAsMain(dummyStudent, 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/main"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made main successfully"));

        verify(studentService).setCVAsMain(dummyStudent, 10L);
    }

    @Test
    void shouldReturnNotFoundWhenMakingCVMainForNonExistentStudent() throws Exception {
        when(studentService.findById(99L)).thenThrow(new UserNotFoundException());

        mockMvc.perform(put("/api/student/99/cvs/10/main"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenMakingMainForNonExistentCv() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doThrow(new CvNotFoundException("CV not found")).when(studentService).setCVAsMain(dummyStudent, 999L);

        mockMvc.perform(put("/api/student/1/cvs/999/main"))
                .andExpect(status().isNotFound());
    }
}

