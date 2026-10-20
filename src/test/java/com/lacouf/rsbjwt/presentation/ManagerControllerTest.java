package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.presentation.users.ManagerController;
import com.lacouf.rsbjwt.service.users.ManagerService;
import com.lacouf.rsbjwt.service.dto.response.cv.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.cv.StudentSummaryDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
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

    private static ManagerCvResponseDto cvWith(ReviewStatus status, String comment) {
        return new ManagerCvResponseDto(1L, "cv.pdf", LocalDateTime.of(2026, 9, 1, 10, 0), status, comment, STUDENT);
    }

    private static InternshipResponseDto internshipWith(ReviewStatus status, String comment) {
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
                1L,
                "employer@example.com",
                Discipline.COMPUTER_SCIENCE,
                LocalDateTime.of(2026, 9, 1, 10, 0),
                false
        );
    }

    @Test
    void shouldReturnAllVisibleCvs() throws Exception {
        // Arrange
        when(managerService.getAllVisibleCvs()).thenReturn(List.of(cvWith(ReviewStatus.PENDING, null), cvWith(ReviewStatus.REJECTED, "CV too detailed")));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].status").value("REJECTED"));

        verify(managerService).getAllVisibleCvs();
    }

    @Test
    void shouldReturnOkWhenCvIsApproved() throws Exception {
        // Arrange
        when(managerService.approveCv(1L)).thenReturn(cvWith(ReviewStatus.APPROVED, null));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(managerService).approveCv(1L);
    }

    @Test
    void shouldReturnOkWhenCvIsRejected() throws Exception {
        // Arrange
        when(managerService.rejectCv(1L, "CV too detailed")).thenReturn(cvWith(ReviewStatus.REJECTED, "CV too detailed"));

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
        when(managerService.approveCv(99L)).thenThrow(new CvNotFoundException(99L));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/99/approve"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenRejectingUnknownCv() throws Exception {
        // Arrange
        when(managerService.rejectCv(99L, "CV too detailed")).thenThrow(new CvNotFoundException(99L));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/99/reject").contentType(MediaType.APPLICATION_JSON).content(REJECTION_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnCvWithStudentInfo() throws Exception {
        // Arrange
        when(managerService.getCv(1L)).thenReturn(cvWith(ReviewStatus.PENDING, null));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.student.email").value("marie@example.com"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingUnknownCv() throws Exception {
        // Arrange
        when(managerService.getCv(99L)).thenThrow(new CvNotFoundException(99L));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/99"))
                .andExpect(status().isNotFound());
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
    void shouldReturnNotFoundWhenGettingFileOfUnknownCv() throws Exception {
        // Arrange
        when(managerService.getCvFile(99L)).thenThrow(new CvNotFoundException(99L));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/99/file"))
                .andExpect(status().isNotFound());
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
    void shouldReturnAllInternships() throws Exception {
        // Arrange
        when(managerService.getAllInternships()).thenReturn(List.of(internshipWith(ReviewStatus.PENDING, null), internshipWith(ReviewStatus.APPROVED, null)));

        // Act + Assert
        mockMvc.perform(get("/api/manager/internships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].status").value("APPROVED"));

        verify(managerService).getAllInternships();
    }

    @Test
    void shouldReturnPendingInternships() throws Exception {
        // Arrange
        when(managerService.getPendingInternships()).thenReturn(List.of(internshipWith(ReviewStatus.PENDING, null)));

        // Act + Assert
        mockMvc.perform(get("/api/manager/internships/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(managerService).getPendingInternships();
    }

    @Test
    void shouldReturnInternshipById() throws Exception {
        // Arrange
        when(managerService.getInternshipById(1L)).thenReturn(internshipWith(ReviewStatus.PENDING, null));

        // Act + Assert
        mockMvc.perform(get("/api/manager/internships/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.title").value("Développeur logiciel"));

        verify(managerService).getInternshipById(1L);
    }

    @Test
    void shouldReturnNotFoundWhenGettingUnknownInternship() throws Exception {
        // Arrange
        when(managerService.getInternshipById(99L)).thenThrow(new InternshipNotFoundException(99L));

        // Act + assert
        mockMvc.perform(get("/api/manager/internships/99")).andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnOkWhenInternshipIsApproved() throws Exception {
        // Arrange
        when(managerService.approveInternship(1L)).thenReturn(internshipWith(ReviewStatus.APPROVED, null));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(managerService).approveInternship(1L);
    }

    @Test
    void shouldReturnOkWhenInternshipIsRejected() throws Exception {
        // Arrange
        when(managerService.rejectInternship(1L, "Offer = bad.")).thenReturn(internshipWith(ReviewStatus.REJECTED, "Offer = bad."));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/1/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Offer = bad.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionComment").value("Offer = bad."));

        verify(managerService).rejectInternship(1L, "Offer = bad.");
    }

    @Test
    void shouldReturnNotFoundWhenApprovingUnknownInternship() throws Exception {
        // Arrange
        when(managerService.approveInternship(99L)).thenThrow(new InternshipNotFoundException(99L));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/99/approve")).andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenRejectingUnknownInternship() throws Exception {
        // Arrange
        when(managerService.rejectInternship(99L, "A ghost?!?")).thenThrow(new InternshipNotFoundException(99L));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/99/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"comment\": \"A ghost?!?\"}")).andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnBadRequestWhenInternshipRejectionCommentIsBlank() throws Exception {
        // Act + assert
        mockMvc.perform(put("/api/manager/internships/1/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"comment\": \"   \"}")).andExpect(status().isBadRequest());

        verifyNoInteractions(managerService);
    }
}