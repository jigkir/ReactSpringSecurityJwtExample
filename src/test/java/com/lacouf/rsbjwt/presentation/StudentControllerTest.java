package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.application.InternshipApplicationNotFoundException;
import com.lacouf.rsbjwt.exception.cv.*;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.presentation.users.StudentController;
import com.lacouf.rsbjwt.service.dto.request.cv.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.request.signup.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.users.ManagerService;
import com.lacouf.rsbjwt.service.users.StudentService;
import org.junit.jupiter.api.BeforeEach;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentController.class)
@AutoConfigureMockMvc
public class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    private static final String STUDENT_EMAIL = "test@claurendeau.qc.ca";
    private static final int MAX_FILE_SIZE = 2 * 1024 * 1024;
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
        // Arrange
        StudentCvResponseDto studentCvResponseDto = new StudentCvResponseDto(10L, "my_cv.pdf", 11L, LocalDateTime.now(), CvVisibility.VISIBLE, ReviewStatus.PENDING, null);
        when(studentService.getCVs(STUDENT_EMAIL)).thenReturn(List.of(studentCvResponseDto));

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].fileName").value("my_cv.pdf"))
                .andExpect(jsonPath("$[0].sizeBytes").value(11))
                .andExpect(jsonPath("$[0].visibility").value(CvVisibility.VISIBLE.name()))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCVsForNonExistentStudent() throws Exception {
        // Arrange
        when(studentService.getCVs(STUDENT_EMAIL)).thenThrow(new UserNotFoundException());

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs").principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnUnprocessableWhenGettingCVsWithCorruptedFile() throws Exception {
        // Arrange
        when(studentService.getCVs(STUDENT_EMAIL)).thenThrow(new CorruptedFileException());

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs").principal(authentication))
                .andExpect(status().is(422));
    }

    @Test
    void shouldGetCVCountSuccessfully() throws Exception {
        // Arrange
        when(studentService.getCVCount(STUDENT_EMAIL)).thenReturn(3L);

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs/count").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("3"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCVCountForNonExistentStudent() throws Exception {
        // Arrange
        when(studentService.getCVCount(STUDENT_EMAIL)).thenThrow(new UserNotFoundException());

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs/count").principal(authentication))
                .andExpect(status().isNotFound());
    }

    // Hide CV Tests

    @Test
    void shouldHideCVSuccessfully() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/student/cvs/10/hide").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("CV hidden successfully"));

        verify(studentService).setCvAsInvisible(STUDENT_EMAIL, 10L);
    }

    @Test
    void shouldReturnNotFoundWhenHidingCvNotOwnedByStudent() throws Exception {
        // Arrange
        doThrow(new CvNotFoundException(10L)).when(studentService).setCvAsInvisible(STUDENT_EMAIL, 10L);

        // Act + Assert
        mockMvc.perform(put("/api/student/cvs/10/hide").principal(authentication))
                .andExpect(status().isNotFound());
    }

    // Upload CV Tests

    @Test
    void shouldUploadCvSuccessfully() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf".getBytes());

        // Act + Assert
        mockMvc.perform(multipart("/api/student/cvs").file(file).principal(authentication))
                .andExpect(status().isCreated())
                .andExpect(content().string("CV uploaded successfully"));

        verify(studentService).uploadCV(any(CvUploadDto.class), eq(STUDENT_EMAIL));
    }

    @Test
    void shouldReturnBadRequestWhenUploadingInvalidFileType() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "cv.txt", "text/plain", "text".getBytes());

        doThrow(new InvalidFileTypeException()).when(studentService).uploadCV(any(CvUploadDto.class), eq(STUDENT_EMAIL));

        // Act + Assert
        mockMvc.perform(multipart("/api/student/cvs").file(file).principal(authentication))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid file type. Only PDF files are allowed."));
    }

    @Test
    void shouldReturnContentTooLargeWhenUploadingTooLargeFile() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf".getBytes());

        doThrow(new InvalidFileSizeException(MAX_FILE_SIZE)).when(studentService).uploadCV(any(CvUploadDto.class), eq(STUDENT_EMAIL));

        // Act + Assert
        mockMvc.perform(multipart("/api/student/cvs").file(file).principal(authentication))
                .andExpect(status().is(413));
    }

    @Test
    void shouldReturnUnprocessableWhenUploadingCorruptedFile() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf".getBytes());

        doThrow(new CorruptedFileException()).when(studentService).uploadCV(any(CvUploadDto.class), eq(STUDENT_EMAIL));

        // Act + Assert
        mockMvc.perform(multipart("/api/student/cvs").file(file).principal(authentication))
                .andExpect(status().is(422));
    }

    @Test
    void shouldReturnNotFoundWhenUploadingCvForNonExistentStudent() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf".getBytes());

        doThrow(new UserNotFoundException()).when(studentService).uploadCV(any(CvUploadDto.class), eq(STUDENT_EMAIL));

        // Act + Assert
        mockMvc.perform(multipart("/api/student/cvs").file(file).principal(authentication))
                .andExpect(status().isNotFound());
    }

    // Get CV File & Status Tests

    @Test
    void shouldReturnCvFileSuccessfully() throws Exception {
        // Arrange
        when(studentService.getCV(STUDENT_EMAIL, 10L)).thenReturn(new CvFileResponseDto(10L, "my_cv.pdf", "pdf".getBytes()));

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs/10").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("my_cv.pdf"))
                .andExpect(jsonPath("$.content").value("cGRm"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCvNotOwnedByStudent() throws Exception {
        // Arrange
        when(studentService.getCV(STUDENT_EMAIL, 10L)).thenThrow(new CvNotFoundException(10L));

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs/10").principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnUnprocessableWhenGettingCorruptedCv() throws Exception {
        // Arrange
        when(studentService.getCV(STUDENT_EMAIL, 10L)).thenThrow(new CorruptedFileException());

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs/10").principal(authentication))
                .andExpect(status().is(422));
    }

    @Test
    void shouldReturnCvStatusSuccessfully() throws Exception {
        // Arrange
        when(studentService.getCVStatus(STUDENT_EMAIL, 10L)).thenReturn("APPROVED");

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs/10/status").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("APPROVED"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingStatusOfCvNotOwnedByStudent() throws Exception {
        // Arrange
        when(studentService.getCVStatus(STUDENT_EMAIL, 10L)).thenThrow(new CvNotFoundException(10L));

        // Act + Assert
        mockMvc.perform(get("/api/student/cvs/10/status").principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnListofAvailableInternships() throws Exception {
        //Arrange
        when(studentService.getInternships(STUDENT_EMAIL))
                .thenReturn(List.of(new InternshipResponseDto(10L, "Test", "This is a Test internship to test that it works", "Java", 12, "Montreal", WorkMode.HYBRID, LocalDate.now().plusMonths(2), LocalDate.now().plusWeeks(2), new BigDecimal(12), false, ReviewStatus.APPROVED, "", 10L, "employer@test.com", Discipline.COMPUTER_SCIENCE, LocalDateTime.now())));

        //Act + Assert

        mockMvc.perform(get("/api/student/internship")
                        .principal(authentication))
                .andExpect(status().isOk()).andExpect(jsonPath("$.size()").value(1));
    }

    @Test
    void shouldReturnNotFoundWhen() throws Exception {
        //Arrange
        when(studentService.getInternships(STUDENT_EMAIL))
                .thenThrow(new UserNotFoundException());

        //Act + Assert

        mockMvc.perform(get("/api/student/internship").principal(authentication)).andExpect(status().isNotFound());
    }

    @Test
    void shouldApplyForInternshipSuccessfully() throws Exception {
        // Arrange
        doNothing().when(studentService).applyToInternship(STUDENT_EMAIL, 5L, 10L);
        // Act & Assert
        mockMvc.perform(post("/api/student/internship/10/apply/5")
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("Application submitted successfully"));

        verify(studentService).applyToInternship(STUDENT_EMAIL, 5L, 10L);
    }

    @Test
    void shouldReturnNotFoundWhenApplyingForNonExistentInternship() throws Exception {
        // Arrange
        doThrow(new InternshipNotFoundException(10L))
                .when(studentService).applyToInternship(STUDENT_EMAIL, 5L, 10L);

        // Act & Assert
        mockMvc.perform(post("/api/student/internship/10/apply/5")
                        .principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenApplyingWithNonExistentCv() throws Exception {
        // Arrange
        doThrow(new CvNotFoundException(10L))
                .when(studentService).applyToInternship(STUDENT_EMAIL, 5L, 10L);

        // Act & Assert
        mockMvc.perform(post("/api/student/internship/10/apply/5")
                        .principal(authentication))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnBadRequestWhenApplyingWithUnapprovedCv() throws Exception {
        // Arrange
        doThrow(new CVNotApprovedException())
                .when(studentService).applyToInternship(STUDENT_EMAIL, 5L, 10L);

        // Act & Assert
        mockMvc.perform(post("/api/student/internship/10/apply/5")
                        .principal(authentication))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldGetAppliedApplicationsSuccessfully() throws Exception {
        // Arrange
        when(studentService.getInternshipApplications(STUDENT_EMAIL))
                .thenReturn(List.of());

        // Act & Assert
        mockMvc.perform(get("/api/student/applications")
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.size()").value(0));
    }

    @Test
    void shouldUpdateApplicationSuccessfully() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/student/applications/1/2")
                        .principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("Application CV updated successfully"));

        verify(studentService).updateInternshipApplication(STUDENT_EMAIL, 1L, 2L);
    }

    @Test
    void shouldReturnBadRequestWhenUpdatingWithUnapprovedCv() throws Exception {
        // Arrange
        doThrow(new CVNotApprovedException())
                .when(studentService).updateInternshipApplication(STUDENT_EMAIL, 1L, 2L);

        // Act & Assert
        mockMvc.perform(put("/api/student/applications/1/2")
                        .principal(authentication))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnNotFoundWhenUpdatingNonExistentApplication() throws Exception {
        // Arrange
        doThrow(new InternshipApplicationNotFoundException(99L))
                .when(studentService).updateInternshipApplication(STUDENT_EMAIL, 99L, 2L);

        // Act & Assert
        mockMvc.perform(put("/api/student/applications/99/2")
                        .principal(authentication))
                .andExpect(status().isNotFound());
    }
}