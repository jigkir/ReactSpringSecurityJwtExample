package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.cv.CvAlreadyReviewedException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.dto.response.CvFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.StudentSummaryDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
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

    private static ManagerCvResponseDto cvWith(CvStatus status, String comment) {
        return new ManagerCvResponseDto(1L, "cv.pdf", LocalDateTime.of(2026, 9, 1, 10, 0), status, comment, STUDENT);
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
    void shouldReturnConflictWhenCvAlreadyReviewed() throws Exception {
        // Arrange
        when(managerService.approveCv(1L)).thenThrow(new CvAlreadyReviewedException(1L));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/approve"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("The CV with ID 1 has already been reviewed."));
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
}