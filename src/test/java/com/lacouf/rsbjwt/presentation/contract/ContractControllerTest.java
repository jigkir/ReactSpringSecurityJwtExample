package com.lacouf.rsbjwt.presentation.contract;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadySignedException;
import com.lacouf.rsbjwt.exception.signature.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.model.Discipline;
import com.lacouf.rsbjwt.model.ReviewStatus;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import com.lacouf.rsbjwt.model.internship.WorkMode;
import com.lacouf.rsbjwt.service.contract.ContractService;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(GlobalExceptionHandler.class)
@WebMvcTest(ContractController.class)
public class ContractControllerTest {

    private static final String MANAGER_EMAIL = "gestion.stages@claurendeau.qc.ca";
    private static final String MANAGER_PASSWORD = "John123#";
    private static final String SIGNATURE_BODY = "{\"termsAccepted\": true, \"password\": \"John123#\"}";

    private final Authentication managerAuthentication = new UsernamePasswordAuthenticationToken(MANAGER_EMAIL, null);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ContractService contractService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    @Test
    void shouldReturnContractsOfChosenSession() throws Exception {
        // Arrange
        ContractResponseDto contract = new ContractResponseDto(30L, internshipWith(ReviewStatus.APPROVED, null), LocalDate.of(2027, 5, 2), "Marie Tremblay", "Jean Dupont", "Tech Corp", null, LocalDateTime.of(2026, 11, 10, 14, 30), null, null, null);

        when(contractService.getContracts(MANAGER_EMAIL, 1L)).thenReturn(List.of(contract));

        // Act + Assert
        mockMvc.perform(get("/api/contracts").param("sessionId", "1").principal(managerAuthentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].studentName").value("Marie Tremblay"))
                .andExpect(jsonPath("$[0].internship.compensationAmount").value(25.00))
                .andExpect(jsonPath("$[0].internshipEndDate").value("2027-05-02"));

        verify(contractService).getContracts(MANAGER_EMAIL, 1L);
    }

    @Test
    void shouldReturnContractsWaitingForSignatureOfUser() throws Exception {
        // Arrange
        ContractResponseDto contract = new ContractResponseDto(30L, internshipWith(ReviewStatus.APPROVED, null), LocalDate.of(2027, 5, 2), "Marie Tremblay", "Jean Dupont", "Tech Corp", null, LocalDateTime.of(2026, 11, 10, 14, 30), null, null, null);

        when(contractService.getContractsToSign(MANAGER_EMAIL)).thenReturn(List.of(contract));

        // Act + Assert
        mockMvc.perform(get("/api/contracts/to-sign").principal(managerAuthentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].studentName").value("Marie Tremblay"))
                .andExpect(jsonPath("$[0].managerSignedAt").doesNotExist());

        verify(contractService).getContractsToSign(MANAGER_EMAIL);
    }

    @Test
    void shouldSignContractAsAuthenticatedManager() throws Exception {
        // Arrange
        ContractResponseDto signedContract = new ContractResponseDto(30L, internshipWith(ReviewStatus.APPROVED, null), LocalDate.of(2027, 5, 2), "Marie Tremblay", "Jean Dupont", "Tech Corp", "John Doe", LocalDateTime.of(2026, 11, 10, 14, 30), null, null, LocalDateTime.of(2026, 11, 11, 9, 0));

        when(contractService.signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD)).thenReturn(signedContract);

        // Act + Assert
        mockMvc.perform(put("/api/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content(SIGNATURE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managerName").value("John Doe"))
                .andExpect(jsonPath("$.managerSignedAt").value("2026-11-11T09:00:00"));

        verify(contractService).signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD);
    }

    @Test
    void shouldReturnBadRequestWhenContractTermsAreNotAccepted() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"termsAccepted\": false, \"password\": \"John123#\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(contractService);
    }

    @Test
    void shouldReturnBadRequestWhenSignaturePasswordIsBlank() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"termsAccepted\": true, \"password\": \" \"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(contractService);
    }

    @Test
    void shouldReturnBadRequestWhenSignaturePasswordIsIncorrect() throws Exception {
        // Arrange
        when(contractService.signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD)).thenThrow(new IncorrectSignaturePasswordException());

        // Act + Assert
        mockMvc.perform(put("/api/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content(SIGNATURE_BODY))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnConflictWhenContractIsAlreadySignedByManager() throws Exception {
        // Arrange
        when(contractService.signContract(MANAGER_EMAIL, 30L, MANAGER_PASSWORD)).thenThrow(new ContractAlreadySignedException(30L, ContractParty.MANAGER));

        // Act + Assert
        mockMvc.perform(put("/api/contracts/30/signature").principal(managerAuthentication)
                        .contentType(MediaType.APPLICATION_JSON).content(SIGNATURE_BODY))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturnContractFileInLanguageChosenByUser() throws Exception {
        // Arrange
        when(contractService.getContractFile(MANAGER_EMAIL, 30L, DocumentLanguage.EN)).thenReturn(new DocumentFileResponseDto(30L, "contrat-30.pdf", "pdf".getBytes()));

        // Act + Assert
        mockMvc.perform(get("/api/contracts/30/file").param("language", "EN").principal(managerAuthentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("contrat-30.pdf"))
                .andExpect(jsonPath("$.content").value("cGRm"));

        verify(contractService).getContractFile(MANAGER_EMAIL, 30L, DocumentLanguage.EN);
    }

    @Test
    void shouldReturnBadRequestWhenContractLanguageIsNotSupported() throws Exception {
        // Act + Assert
        mockMvc.perform(get("/api/contracts/30/file").param("language", "DE"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(contractService);
    }

    // ---------- Helpers ----------

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
}
