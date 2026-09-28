package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.cv.CvAlreadyReviewedException;
import com.lacouf.rsbjwt.exception.cv.CvNotFoundException;
import com.lacouf.rsbjwt.model.cv.CVSharingScope;
import com.lacouf.rsbjwt.model.cv.CvPriority;
import com.lacouf.rsbjwt.model.cv.CvStatus;
import com.lacouf.rsbjwt.model.cv.CvVisibility;
import com.lacouf.rsbjwt.service.ManagerService;
import com.lacouf.rsbjwt.service.dto.response.CVDto;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
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

    private static CVDto cvDto;

    @BeforeAll
    static void setup() {
        cvDto = new CVDto("pdf".getBytes(), 1L, CVSharingScope.PUBLIC, "cv.pdf", 3L, LocalDateTime.of(2026, 9, 1, 10, 0), CvPriority.MAIN, CvVisibility.VISIBLE, CvStatus.PENDING);
    }

    @Test
    void shouldReturnPendingPublicCvs() throws Exception {
        // Arrange
        when(managerService.getPendingPublicCvs()).thenReturn(List.of(cvDto));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].fileName").value("cv.pdf"))
                .andExpect(jsonPath("$[0].sharingScope").value("PUBLIC"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(managerService).getPendingPublicCvs();
    }

    @Test
    void shouldReturnOkWhenCvIsApproved() throws Exception {
        // Arrange
        when(managerService.approveCv(1L)).thenReturn(cvDto);

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(managerService).approveCv(1L);
    }

    @Test
    void shouldReturnOkWhenCvIsRejected() throws Exception {
        // Arrange
        when(managerService.rejectCv(1L)).thenReturn(cvDto);

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(managerService).rejectCv(1L);
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
        when(managerService.rejectCv(99L)).thenThrow(new CvNotFoundException("CV with ID 99 not found."));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/99/reject"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnApprovedStatusWhenCvIsApproved() throws Exception {
        // Arrange
        CVDto approved = new CVDto("pdf".getBytes(), 1L, CVSharingScope.PUBLIC, "cv.pdf", 3L, LocalDateTime.of(2026, 9, 1, 10, 0), CvPriority.MAIN, CvVisibility.VISIBLE, CvStatus.APPROVED);
        when(managerService.approveCv(1L)).thenReturn(approved);

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
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
}
