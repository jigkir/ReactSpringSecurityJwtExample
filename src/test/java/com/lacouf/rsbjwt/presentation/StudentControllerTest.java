package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.model.cv.CVSharingScope;
import com.lacouf.rsbjwt.model.cv.CvPriority;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.exception.cv.CVAlreadyPublicException;
import com.lacouf.rsbjwt.exception.cv.CVAlreadyPrivateException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.presentation.users.StudentController;
import com.lacouf.rsbjwt.service.users.ManagerService;
import com.lacouf.rsbjwt.service.users.StudentService;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.web.servlet.MockMvc;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;

@WebMvcTest(StudentController.class)
@AutoConfigureMockMvc
public class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    private static final String STUDENT_EMAIL = "test@claurendeau.qc.ca";
    private final Authentication authentication = new UsernamePasswordAuthenticationToken(STUDENT_EMAIL, null);

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
    }

    @MockitoBean
    private StudentService studentService;

    @MockitoBean
    private ManagerService managerService;

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
        StudentCvResponseDto studentCvResponseDto = new StudentCvResponseDto(10L, CVSharingScope.PRIVATE, "my_cv.pdf", 11L, LocalDateTime.now(), CvPriority.SECONDARY, CvVisibility.VISIBLE, CvStatus.PENDING, null);
        when(studentService.getCVs(STUDENT_EMAIL)).thenReturn(List.of(studentCvResponseDto));

        mockMvc.perform(get("/api/student/cvs").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].fileName").value("my_cv.pdf"))
                .andExpect(jsonPath("$[0].sharingScope").value("PRIVATE"))
                .andExpect(jsonPath("$[0].visibility").value(CvVisibility.VISIBLE.name()))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCVsForNonExistentStudent() throws Exception {
        when(studentService.getCVs(STUDENT_EMAIL)).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/student/cvs").principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldGetCVCountSuccessfully() throws Exception {
        when(studentService.getCVCount(STUDENT_EMAIL)).thenReturn(3L);

        mockMvc.perform(get("/api/student/cvs/count").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("3"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCVCountForNonExistentStudent() throws Exception {
        when(studentService.getCVCount(STUDENT_EMAIL)).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/student/cvs/count").principal(authentication))
                .andExpect(status().isNotFound());
    }

    // Hide, Make Public & Make Private CV Tests

    @Test
    void shouldHideCVSuccessfully() throws Exception {
        mockMvc.perform(put("/api/student/cvs/10/hide").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("CV hidden successfully"));

        verify(studentService).setCvAsInvisible(STUDENT_EMAIL, 10L);
    }

    @Test
    void shouldReturnNotFoundWhenHidingCvNotOwnedByStudent() throws Exception {
        doThrow(new CvNotFoundException("CV not found")).when(studentService).setCvAsInvisible(STUDENT_EMAIL, 10L);

        mockMvc.perform(put("/api/student/cvs/10/hide").principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldMakeCVPublicSuccessfully() throws Exception {
        mockMvc.perform(put("/api/student/cvs/10/public").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made public successfully"));

        verify(studentService).setCvAsPublic(STUDENT_EMAIL, 10L);
    }

    @Test
    void shouldReturnConflictWhenCVAlreadyPublic() throws Exception {
        doThrow(new CVAlreadyPublicException("CV is already public")).when(studentService).setCvAsPublic(STUDENT_EMAIL, 10L);

        mockMvc.perform(put("/api/student/cvs/10/public").principal(authentication))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldMakeCVPrivateSuccessfully() throws Exception {
        mockMvc.perform(put("/api/student/cvs/10/private").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made private successfully"));

        verify(studentService).setCvAsPrivate(STUDENT_EMAIL, 10L);
    }

    @Test
    void shouldReturnConflictWhenCVAlreadyPrivate() throws Exception {
        doThrow(new CVAlreadyPrivateException("CV is already private")).when(studentService).setCvAsPrivate(STUDENT_EMAIL, 10L);

        mockMvc.perform(put("/api/student/cvs/10/private").principal(authentication))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldMakeCVSecondarySuccessfully() throws Exception {
        mockMvc.perform(put("/api/student/cvs/10/secondary").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made secondary successfully"));

        verify(studentService).setCVAsSecondary(STUDENT_EMAIL, 10L);
    }

    @Test
    void shouldReturnNotFoundWhenMakingSecondaryForCvNotOwnedByStudent() throws Exception {
        doThrow(new CvNotFoundException("CV not found")).when(studentService).setCVAsSecondary(STUDENT_EMAIL, 999L);

        mockMvc.perform(put("/api/student/cvs/999/secondary").principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldMakeCVMainSuccessfully() throws Exception {
        mockMvc.perform(put("/api/student/cvs/10/main").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made main successfully"));

        verify(studentService).setCVAsMain(STUDENT_EMAIL, 10L);
    }

    @Test
    void shouldReturnNotFoundWhenMakingMainForCvNotOwnedByStudent() throws Exception {
        doThrow(new CvNotFoundException("CV not found")).when(studentService).setCVAsMain(STUDENT_EMAIL, 999L);

        mockMvc.perform(put("/api/student/cvs/999/main").principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldUploadCvSuccessfully() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf".getBytes());

        mockMvc.perform(multipart("/api/student/cvs").file(file).principal(authentication))
                .andExpect(status().isCreated());

        verify(studentService).uploadCV(any(CvUploadDto.class), eq(STUDENT_EMAIL));
    }

    @Test
    void shouldReturnCvFileSuccessfully() throws Exception {
        when(studentService.getCV(STUDENT_EMAIL, 10L)).thenReturn(new CvFileResponseDto(10L, "my_cv.pdf", "pdf".getBytes()));

        mockMvc.perform(get("/api/student/cvs/10").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("my_cv.pdf"))
                .andExpect(jsonPath("$.content").value("cGRm"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCvNotOwnedByStudent() throws Exception {
        when(studentService.getCV(STUDENT_EMAIL, 10L)).thenThrow(new CvNotFoundException("CV not found"));

        mockMvc.perform(get("/api/student/cvs/10").principal(authentication))
                .andExpect(status().isNotFound());
    }
}