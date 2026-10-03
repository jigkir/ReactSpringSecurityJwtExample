package com.lacouf.rsbjwt.presentation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.model.*;
import com.lacouf.rsbjwt.model.auth.Credentials;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.model.auth.Role;
import com.lacouf.rsbjwt.model.cv.CVSharingScope;
import com.lacouf.rsbjwt.model.cv.CvPriority;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.exception.cv.CVAlreadyPublicException;
import com.lacouf.rsbjwt.exception.cv.CVAlreadyPrivateException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserAlreadyExistsException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.StudentService;
import com.lacouf.rsbjwt.service.dto.request.CvUploadDto;
import com.lacouf.rsbjwt.service.dto.response.NotificationDto;
import com.lacouf.rsbjwt.service.dto.request.StudentSignUpDto;
import com.lacouf.rsbjwt.service.dto.response.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.UserResponseDto;
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
import com.lacouf.rsbjwt.service.dto.response.StudentCvResponseDto;

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

    private final Authentication authentication = new UsernamePasswordAuthenticationToken("test@claurendeau.qc.ca", null);


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
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        when(studentService.getCVs(dummyStudent.getId())).thenReturn(List.of(studentCvResponseDto));

        mockMvc.perform(get("/api/student/1/cvs"))
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
        when(studentService.getCVs(99L)).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/student/99/cvs"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldGetCVCountSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        when(studentService.getCVCountByStudentId(dummyStudent.getId())).thenReturn(3L);

        mockMvc.perform(get("/api/student/1/cvs/count"))
                .andExpect(status().isOk())
                .andExpect(content().string("3"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingCVCountForNonExistentStudent() throws Exception {
        when(studentService.getCVCountByStudentId(99L)).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/student/99/cvs/count"))
                .andExpect(status().isNotFound());
    }

    // Hide, Make Public & Make Private CV Tests

    @Test
    void shouldHideCVSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCvAsInvisible(dummyStudent.getId(), 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/hide"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV hidden successfully"));

        verify(studentService).setCvAsInvisible(dummyStudent.getId(), 10L);
    }

    @Test
    void shouldReturnNotFoundWhenHidingCVForNonExistentStudent() throws Exception {
        doThrow(new UserNotFoundException()).when(studentService).setCvAsInvisible(99L, 10L);

        mockMvc.perform(put("/api/student/99/cvs/10/hide"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldMakeCVPublicSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCvAsPublic(dummyStudent.getId(), 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/public"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made public successfully"));

        verify(studentService).setCvAsPublic(dummyStudent.getId(), 10L);
    }

    @Test
    void shouldReturnConflictWhenCVAlreadyPublic() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doThrow(new CVAlreadyPublicException("CV is already public")).when(studentService).setCvAsPublic(dummyStudent.getId(), 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/public"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldMakeCVPrivateSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCvAsPrivate(dummyStudent.getId(), 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/private"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made private successfully"));

        verify(studentService).setCvAsPrivate(dummyStudent.getId(), 10L);
    }

    @Test
    void shouldReturnConflictWhenCVAlreadyPrivate() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doThrow(new CVAlreadyPrivateException("CV is already private")).when(studentService).setCvAsPrivate(dummyStudent.getId(), 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/private"))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldMakeCVSecondarySuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCVAsSecondary(dummyStudent.getId(), 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/secondary"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made secondary successfully"));

        verify(studentService).setCVAsSecondary(dummyStudent.getId(), 10L);
    }

    @Test
    void shouldReturnNotFoundWhenMakingCVSecondaryForNonExistentStudent() throws Exception {
        doThrow(new UserNotFoundException()).when(studentService).setCVAsSecondary(99L, 10L);

        mockMvc.perform(put("/api/student/99/cvs/10/secondary"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenMakingSecondaryForNonExistentCv() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doThrow(new CvNotFoundException("CV not found")).when(studentService).setCVAsSecondary(dummyStudent.getId(), 999L);

        mockMvc.perform(put("/api/student/1/cvs/999/secondary"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldMakeCVMainSuccessfully() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doNothing().when(studentService).setCVAsMain(dummyStudent.getId(), 10L);

        mockMvc.perform(put("/api/student/1/cvs/10/main"))
                .andExpect(status().isOk())
                .andExpect(content().string("CV made main successfully"));

        verify(studentService).setCVAsMain(dummyStudent.getId(), 10L);
    }

    @Test
    void shouldReturnNotFoundWhenMakingCVMainForNonExistentStudent() throws Exception {
        doThrow(new UserNotFoundException()).when(studentService).setCVAsMain(99L, 10L);

        mockMvc.perform(put("/api/student/99/cvs/10/main"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenMakingMainForNonExistentCv() throws Exception {
        when(studentService.findById(1L)).thenReturn(dummyStudent);
        doThrow(new CvNotFoundException("CV not found")).when(studentService).setCVAsMain(dummyStudent.getId(), 999L);

        mockMvc.perform(put("/api/student/1/cvs/999/main"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldUploadCvSuccessfully() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cv.pdf", "application/pdf", "pdf".getBytes());

        mockMvc.perform(multipart("/api/student/1/cvs").file(file))
                .andExpect(status().isCreated());

        verify(studentService).uploadCV(any(CvUploadDto.class), eq(1L));
    }

    @Test
    void shouldReturnCvFileSuccessfully() throws Exception {
        when(studentService.getCVByStudentId(1L, 10L)).thenReturn(new CvFileResponseDto(10L, "my_cv.pdf", "pdf".getBytes()));

        mockMvc.perform(get("/api/student/1/cvs/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("my_cv.pdf"))
                .andExpect(jsonPath("$.content").value("cGRm"));
    }

    // Notification Tests

    @Test
    void shouldGetStudentNotificationsSuccessfully() throws Exception {
        NotificationDto notificationDto = new NotificationDto(
                100L,
                "New Internship Offer",
                "A new internship offer has been posted that matches your discipline.",
                NotificationStatus.UNREAD,
                TargetType.INTERNSHIP_OFFER,
                NotificationType.NEW_INTERNSHIP_OFFER,
                50L,
                LocalDateTime.now()
        );

        when(studentService.getStudentNotifications("test@claurendeau.qc.ca"))
                .thenReturn(List.of(notificationDto));

        mockMvc.perform(get("/api/student/notifications").principal(authentication)
                        .with(user("test@claurendeau.qc.ca").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].title").value("New Internship Offer"))
                .andExpect(jsonPath("$[0].message").value("A new internship offer has been posted that matches your discipline."))
                .andExpect(jsonPath("$[0].status").value("UNREAD"))
                .andExpect(jsonPath("$[0].notificationType").value("NEW_INTERNSHIP_OFFER"))
                .andExpect(jsonPath("$[0].targetType").value("INTERNSHIP_OFFER"))
                .andExpect(jsonPath("$[0].targetId").value(50));

        verify(studentService).getStudentNotifications("test@claurendeau.qc.ca");
    }

    @Test
    void shouldMarkNotificationAsReadSuccessfully() throws Exception {
        doNothing().when(studentService).markNotificationAsRead(100L);

        mockMvc.perform(put("/api/student/notifications/100/read").principal(authentication)
                        .with(user("test@claurendeau.qc.ca").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(content().string("Notification marked as read successfully"));

        verify(studentService).markNotificationAsRead(100L);
    }

    @Test
    void shouldReturnNotFoundWhenMarkingNonExistentNotificationAsRead() throws Exception {
        doThrow(new UserNotFoundException()).when(studentService).markNotificationAsRead(999L);

        mockMvc.perform(put("/api/student/notifications/999/read")
                        .with(user("test@claurendeau.qc.ca").roles("STUDENT")))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldMarkInternshipsNotificationsAsReadSuccessfully() throws Exception {
        doNothing().when(studentService).markInternshipsNotificationAsRead("test@claurendeau.qc.ca");

        mockMvc.perform(put("/api/student/notifications/internship/read").principal(authentication)
                        .with(user("test@claurendeau.qc.ca").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(content().string("Notifications marked as read successfully"));

        verify(studentService).markInternshipsNotificationAsRead("test@claurendeau.qc.ca");
    }

    @Test
    void shouldGetUnreadInternshipNotificationsCountSuccessfully() throws Exception {
        when(studentService.getUnreadNotificationCountForInternships("test@claurendeau.qc.ca"))
                .thenReturn(Math.toIntExact(5L));

        mockMvc.perform(get("/api/student/notifications/internship/unread/count").principal(authentication)
                        .with(user("test@claurendeau.qc.ca").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(content().string("5"));

        verify(studentService).getUnreadNotificationCountForInternships("test@claurendeau.qc.ca");
    }
}