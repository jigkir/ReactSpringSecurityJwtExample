package com.lacouf.rsbjwt.presentation.users;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadySignedException;
import com.lacouf.rsbjwt.exception.document.student.cv.CVUsedInApplicationException;
import com.lacouf.rsbjwt.exception.internship.InternshipNotFoundException;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.document.DocumentNotFoundException;
import com.lacouf.rsbjwt.exception.internship.PastSessionInternshipNotEditableException;
import com.lacouf.rsbjwt.exception.contract.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.session.Season;
import com.lacouf.rsbjwt.model.user.AccountStatus;
import com.lacouf.rsbjwt.service.dto.request.internship.InternshipRequestDto;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.StudentAccessResponseDto;
import com.lacouf.rsbjwt.service.users.AccountAccessService;
import com.lacouf.rsbjwt.service.users.ManagerService;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.student.cv.ManagerCvResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.StudentSummaryDto;
import com.lacouf.rsbjwt.service.dto.response.internship.InternshipResponseDto;
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
    private AccountAccessService accountAccessService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    private static final String REJECTION_BODY = "{\"comment\": \"CV too detailed\"}";
    private static final String INTERNSHIP_BODY = """
            {"title": "Développeur backend", "description": "Stage en développement backend", "requiredSkills": "Java, Spring Boot",
             "durationInWeeks": 16, "location": "Montréal", "workMode": "HYBRID", "startDate": "2027-01-10",
             "applicationDeadline": "2026-12-01", "compensationAmount": 27.00, "compensationNegotiable": false}
            """;
    private static final StudentSummaryDto STUDENT = new StudentSummaryDto(2L, "Marie", "Tremblay", "marie@example.com", "2234567", Discipline.COMPUTER_SCIENCE);

    private static final String MANAGER_EMAIL = "gestion.stages@claurendeau.qc.ca";
    private static final String MANAGER_PASSWORD = "John123#";
    private static final String SIGNATURE_BODY = "{\"termsAccepted\": true, \"password\": \"John123#\"}";

    private final Authentication managerAuthentication = new UsernamePasswordAuthenticationToken(MANAGER_EMAIL, null);

    @Test
    void shouldReturnVisibleCvsOfChosenSession() throws Exception {
        // Arrange
        when(managerService.getVisibleCvs(1L)).thenReturn(List.of(cvWith(ReviewStatus.PENDING, null), cvWith(ReviewStatus.REJECTED, "CV too detailed")));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs").param("sessionId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].status").value("REJECTED"));

        verify(managerService).getVisibleCvs(1L);
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
        when(managerService.approveCv(99L)).thenThrow(new DocumentNotFoundException(99L));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/99/approve"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundWhenRejectingUnknownCv() throws Exception {
        // Arrange
        when(managerService.rejectCv(99L, "CV too detailed")).thenThrow(new DocumentNotFoundException(99L));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/99/reject").contentType(MediaType.APPLICATION_JSON).content(REJECTION_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnConflictWhenRejectingCvUsedInApplication() throws Exception {
        // Arrange
        when(managerService.rejectCv(1L, "CV too detailed")).thenThrow(new CVUsedInApplicationException(1L));

        // Act + Assert
        mockMvc.perform(put("/api/manager/cvs/1/reject").contentType(MediaType.APPLICATION_JSON).content(REJECTION_BODY))
                .andExpect(status().isConflict());
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
        when(managerService.getCv(99L)).thenThrow(new DocumentNotFoundException(99L));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnCvFile() throws Exception {
        // Arrange
        when(managerService.getCvFile(1L)).thenReturn(new DocumentFileResponseDto(1L, "cv.pdf", "pdf".getBytes()));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/1/file"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("cGRm"));
    }

    @Test
    void shouldReturnNotFoundWhenGettingFileOfUnknownCv() throws Exception {
        // Arrange
        when(managerService.getCvFile(99L)).thenThrow(new DocumentNotFoundException(99L));

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
        when(managerService.getAllInternships(null)).thenReturn(List.of(internshipWith(ReviewStatus.PENDING, null), internshipWith(ReviewStatus.APPROVED, null)));

        // Act + Assert
        mockMvc.perform(get("/api/manager/internships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].status").value("APPROVED"));

        verify(managerService).getAllInternships(null);
    }

    @Test
    void shouldReturnPendingCvs() throws Exception {
        // Arrange
        when(managerService.getPendingCvs()).thenReturn(List.of(cvWith(ReviewStatus.PENDING, null)));

        // Act + Assert
        mockMvc.perform(get("/api/manager/cvs/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        verify(managerService).getPendingCvs();
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
    void shouldReturnConflictWhenApprovingPastSessionInternship() throws Exception {
        // Arrange
        when(managerService.approveInternship(1L)).thenThrow(new PastSessionInternshipNotEditableException(new AcademicSession(Season.WINTER, 2026)));

        // Act + assert
        mockMvc.perform(put("/api/manager/internships/1/approve")).andExpect(status().isConflict());
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

    @Test
    void shouldReturnOkWhenManagerUpdatesInternship() throws Exception {
        // Arrange
        when(managerService.updateInternship(eq(1L), any(InternshipRequestDto.class))).thenReturn(internshipWith(ReviewStatus.APPROVED, null));

        // Act + Assert
        mockMvc.perform(put("/api/manager/internships/1").contentType(MediaType.APPLICATION_JSON).content(INTERNSHIP_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(managerService).updateInternship(eq(1L), any(InternshipRequestDto.class));
    }

    @Test
    void shouldReturnConflictWhenManagerUpdatesPastSessionInternship() throws Exception {
        // Arrange
        when(managerService.updateInternship(eq(1L), any(InternshipRequestDto.class)))
                .thenThrow(new PastSessionInternshipNotEditableException(new AcademicSession(Season.WINTER, 2026)));

        // Act + Assert
        mockMvc.perform(put("/api/manager/internships/1").contentType(MediaType.APPLICATION_JSON).content(INTERNSHIP_BODY))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturnInternshipsOfChosenSession() throws Exception {
        // Arrange
        when(managerService.getAllInternships(2L)).thenReturn(List.of());

        // Act + Assert
        mockMvc.perform(get("/api/manager/internships").param("sessionId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        verify(managerService).getAllInternships(2L);
    }

    @Test
    void shouldReturnStudentAccesses() throws Exception {
        // Arrange
        when(accountAccessService.getStudentAccesses()).thenReturn(List.of(studentAccessWith(AccountStatus.PENDING)));

        // Act + Assert
        mockMvc.perform(get("/api/manager/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void shouldReturnExpiredStudentAccessesWhenManagerAsksForExpiredAccounts() throws Exception {
        // Arrange
        when(accountAccessService.getExpiredStudentAccesses()).thenReturn(List.of(studentAccessWith(AccountStatus.PENDING)));

        // Act + Assert
        mockMvc.perform(get("/api/manager/students/expired"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void shouldReturnOkWhenStudentIsReactivated() throws Exception {
        // Arrange
        when(accountAccessService.reactivateStudentAccess(2L)).thenReturn(studentAccessWith(AccountStatus.APPROVED));

        // Act + Assert
        mockMvc.perform(put("/api/manager/students/2/reactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(accountAccessService).reactivateStudentAccess(2L);
    }

    @Test
    void shouldReturnOkWhenStudentAccessIsDenied() throws Exception {
        // Arrange
        when(accountAccessService.denyStudentAccess(2L)).thenReturn(studentAccessWith(AccountStatus.REJECTED));

        // Act + Assert
        mockMvc.perform(put("/api/manager/students/2/deny"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        verify(accountAccessService).denyStudentAccess(2L);
    }

    @Test
    void shouldReturnContractsOfChosenSession() throws Exception {
        // Arrange
        ContractResponseDto contract = new ContractResponseDto(30L, internshipWith(ReviewStatus.APPROVED, null), LocalDate.of(2027, 5, 2), "Marie Tremblay", "Jean Dupont", "Tech Corp", null, LocalDateTime.of(2026, 11, 10, 14, 30), null, null, null);

        when(managerService.getContracts(1L)).thenReturn(List.of(contract));

        // Act + Assert
        mockMvc.perform(get("/api/manager/contracts").param("sessionId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].studentName").value("Marie Tremblay"))
                .andExpect(jsonPath("$[0].internship.compensationAmount").value(25.00))
                .andExpect(jsonPath("$[0].internshipEndDate").value("2027-05-02"));

        verify(managerService).getContracts(1L);
    }

    @Test
    void shouldSignContractAsAuthenticatedManager() throws Exception {
        // Arrange
        ContractResponseDto signedContract = new ContractResponseDto(30L, internshipWith(ReviewStatus.APPROVED, null), LocalDate.of(2027, 5, 2), "Marie Tremblay", "Jean Dupont", "Tech Corp", "John Doe", LocalDateTime.of(2026, 11, 10, 14, 30), null, null, LocalDateTime.of(2026, 11, 11, 9, 0));

        when(managerService.signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD)).thenReturn(signedContract);

        // Act + Assert
        mockMvc.perform(put("/api/manager/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content(SIGNATURE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managerName").value("John Doe"))
                .andExpect(jsonPath("$.managerSignedAt").value("2026-11-11T09:00:00"));

        verify(managerService).signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD);
    }

    @Test
    void shouldReturnBadRequestWhenContractTermsAreNotAccepted() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/manager/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"termsAccepted\": false, \"password\": \"John123#\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(managerService);
    }

    @Test
    void shouldReturnBadRequestWhenSignaturePasswordIsBlank() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/manager/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"termsAccepted\": true, \"password\": \" \"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(managerService);
    }

    @Test
    void shouldReturnBadRequestWhenSignaturePasswordIsIncorrect() throws Exception {
        // Arrange
        when(managerService.signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD)).thenThrow(new IncorrectSignaturePasswordException());

        // Act + Assert
        mockMvc.perform(put("/api/manager/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content(SIGNATURE_BODY))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnConflictWhenContractIsAlreadySignedByManager() throws Exception {
        // Arrange
        when(managerService.signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD)).thenThrow(new ContractAlreadySignedException(30L, ContractParty.MANAGER));

        // Act + Assert
        mockMvc.perform(put("/api/manager/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content(SIGNATURE_BODY))
                .andExpect(status().isConflict());
    }

    // ---------- Helpers ----------

    private static ManagerCvResponseDto cvWith(ReviewStatus status, String comment) {
        return new ManagerCvResponseDto(1L, "cv.pdf", LocalDateTime.of(2026, 9, 1, 10, 0), status, comment, STUDENT, false);
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
                LocalDateTime.of(2026, 9, 1, 10, 0)
        );
    }

    private static StudentAccessResponseDto studentAccessWith(AccountStatus status) {
        return new StudentAccessResponseDto(2L, "Marie", "Tremblay", "marie@example.com", "2234567", Discipline.COMPUTER_SCIENCE, status);
    }
}