package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.model.internship.InternshipStatus;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.dto.response.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(GlobalExceptionHandler.class)
@WebMvcTest(ManagerController.class)
public class ManagerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ManagerService managerService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    private static final String REJECTION_BODY = "{\"comment\": \"CV too detailed\"}";
    private static final StudentSummaryDto STUDENT = new StudentSummaryDto(2L, "Marie", "Tremblay", "marie@example.com", "2234567", Discipline.COMPUTER_SCIENCE);

    private final Authentication authentication = new UsernamePasswordAuthenticationToken("manager@example.com", null);

    private static ManagerCvResponseDto cvWith(CvStatus status, String comment) {
        return new ManagerCvResponseDto(1L, "cv.pdf", LocalDateTime.of(2026, 9, 1, 10, 0), status, comment, STUDENT);
    }

    private static InternshipResponseDto internshipWith(InternshipStatus status, String comment) {
        return new InternshipResponseDto(
                1L,
                "Développeur logiciel",
                "Stage en développement logiciel",
                "Java, Spring Boot",
                16,
                "Montréal",
                WorkMode.HYBRID,
                LocalDate.of(2027, 1, 10),
                LocalDate.of(2026, 12, 1),
                new BigDecimal("25.00"),
                false,
                status,
                comment,
                1L
        );
    }

    @Test
    void shouldReturnAllPublicCvs() throws Exception {
        // Arrange
        when(managerService.getAllPublicCvs()).thenReturn(List.of(cvWith(CvStatus.PENDING, null), cvWith(CvStatus.REJECTED, "CV too detailed")));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].status").value("REJECTED"));

        verify(managerService).getAllPublicCvs();
    }

    @Test
    void shouldReturnOkWhenCvIsApproved() throws Exception {
        // Arrange
        when(managerService.approveCv(1L)).thenReturn(cvWith(CvStatus.APPROVED, null));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(managerService).approveCv(1L);
    }

    @Test
    void shouldReturnOkWhenCvIsRejected() throws Exception {
        // Arrange
        when(managerService.rejectCv(1L, "CV too detailed")).thenReturn(cvWith(CvStatus.REJECTED, "CV too detailed"));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/reject").contentType(MediaType.APPLICATION_JSON).content(REJECTION_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionComment").value("CV too detailed"));

        verify(managerService).rejectCv(1L, "CV too detailed");
    }

    @Test
    void shouldReturnNotFoundWhenApprovingUnknownCv() throws Exception {
        // Arrange
        when(managerService.approveCv(99L)).thenThrow(new CvNotFoundException("CV with ID 99 not found."));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/99/approve"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenRejectingUnknownCv() throws Exception {
        // Arrange
        when(managerService.rejectCv(99L, "CV too detailed")).thenThrow(new CvNotFoundException("CV with ID 99 not found."));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/99/reject").contentType(MediaType.APPLICATION_JSON).content(REJECTION_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnCvWithStudentInfo() throws Exception {
        // Arrange
        when(managerService.getCv(1L)).thenReturn(cvWith(CvStatus.PENDING, null));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.student.email").value("marie@example.com"));
    }

    @Test
    void shouldReturnCvFile() throws Exception {
        // Arrange
        when(managerService.getCvFile(1L)).thenReturn(new CvFileResponseDto(1L, "cv.pdf", "pdf".getBytes()));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/1/file"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("cGRm"));
    }

    @Test
    void shouldReturnBadRequestWhenRejectionCommentIsBlank() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/reject").contentType(MediaType.APPLICATION_JSON).content("{\"comment\": \"   \"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(managerService);
    }

    @Test
    void shouldReturnBadRequestWhenRejectionBodyIsMissing() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/reject").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(managerService);
    }

    @Test
    void shouldReturnNotificationsOfConnectedManager() throws Exception {
        // Arrange
        when(managerService.getNotificationsForManager("manager@example.com")).thenReturn(List.of(new NotificationDto(5L, "New CV Pending Review", "A new CV has been submitted for review.", NotificationStatus.UNREAD, TargetType.CV, NotificationType.CV_SUBMITTED_FOR_REVIEW, 1L, LocalDateTime.now())));

        // Act + Assert
        mockMvc.perform(get("/api/manager/notifications").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5))
                .andExpect(jsonPath("$[0].notificationType").value("CV_SUBMITTED_FOR_REVIEW"))
                .andExpect(jsonPath("$[0].targetId").value(1));

        verify(managerService).getNotificationsForManager("manager@example.com");
    }

    @Test
    void shouldMarkManagerNotificationAsRead() throws Exception {
        // Arrange
        when(managerService.markNotificationAsRead(5L, "manager@example.com")).thenReturn(new NotificationDto(5L, "New CV Pending Review", "A new CV has been submitted for review.", NotificationStatus.READ, TargetType.CV, NotificationType.CV_SUBMITTED_FOR_REVIEW, 1L, LocalDateTime.now()));

        // Act + Assert
        mockMvc.perform(put("/api/manager/notifications/5/read").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READ"));
    }

    //get offer by id
    @Test
    void shouldReturnInternshipById() throws Exception {
        // Arrange
        when(managerService.getInternshipById(1L)).thenReturn(internshipWith(InternshipStatus.PENDING, null));

        // Act + Assert
        mockMvc.perform(get("/api/manager/internships/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.title").value("Développeur logiciel"));

        verify(managerService).getInternshipById(1L);
    }

    //approve internship
    @Test
    void shouldReturnOkWhenInternshipIsApproved() throws Exception {
        // Arrange
        when(managerService.approveInternship(1L)).thenReturn(internshipWith(InternshipStatus.APPROVED, null));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(managerService).approveInternship(1L);
    }

    //reject internship
    @Test
    void shouldReturnOkWhenInternshipIsRejected() throws Exception {
        // Arrange
        when(managerService.rejectInternship(1L, "Offer = bad.")).thenReturn(internshipWith(InternshipStatus.REJECTED, "Offer = bad."));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/1/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Offer = bad.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionComment").value("Offer = bad."));

        verify(managerService).rejectInternship(1L, "Offer = bad.");
    }

    //404 approve internship inexistant
    @Test
    void shouldReturnNotFoundWhenApprovingUnknownInternship() throws Exception {
        // Arrange
        when(managerService.approveInternship(99L)).thenThrow(new InternshipNotFoundException(99L));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/99/approve")).andExpect(status().isNotFound());
    }

    //404 reject internship inexistant
    @Test
    void shouldReturnNotFoundWhenRejectingUnknownInternship() throws Exception {
        // Arrange
        when(managerService.rejectInternship(99L, "A ghost?!?")).thenThrow(new InternshipNotFoundException(99L));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/99/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"comment\": \"A ghost?!?\"}")).andExpect(status().isNotFound());
    }
}