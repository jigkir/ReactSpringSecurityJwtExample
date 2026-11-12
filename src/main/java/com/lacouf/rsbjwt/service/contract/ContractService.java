package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.exception.contract.*;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractLanguage;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.model.user.Manager;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.StudentInternshipStatus;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContractService {
    private static final String FILE_NAME_PREFIX = "contrat-";
    private static final String PDF_EXTENSION = ".pdf";

    private final ContractPdfGenerator contractPdfGenerator;
    private final ContractRepository contractRepository;
    private final Clock clock;

    public ContractService(ContractPdfGenerator contractPdfGenerator, ContractRepository contractRepository, Clock clock) {
        this.contractPdfGenerator = contractPdfGenerator;
        this.contractRepository = contractRepository;
        this.clock = clock;
    }

    @Transactional
    public Contract createContract(InternshipApplication application) throws ContractAlreadyExistsException, StudentAlreadyEmployedException, ApplicationRejectedException, ApplicationNotOfferedException {
        checkIfContractCanBeCreated(application);

        return contractRepository.save(new Contract(application, LocalDateTime.now(clock)));
    }

    @Transactional(readOnly = true)
    public List<ContractResponseDto> getContracts(AcademicSession session) {
        return contractRepository.findByInternship_Session(session).stream()
                .map(ContractResponseDto::of)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<ContractResponseDto> getPendingContracts() {
        return contractRepository.findByManagerSignedAtIsNull().stream()
                .map(ContractResponseDto::of)
                .toList();
    }

    @Transactional
    public ContractResponseDto signAsManager(long contractId, Manager manager) throws ContractNotFoundException, ContractAlreadySignedException {
        Contract contract = findContract(contractId);

        contract.signAsManager(manager, getSigningTime(contract, ContractParty.MANAGER));

        return ContractResponseDto.of(contractRepository.save(contract));
    }

    @Transactional(readOnly = true)
    public DocumentFileResponseDto getContractFile(long contractId, ContractLanguage language) throws ContractNotFoundException {
        Contract contract = findContract(contractId);

        return new DocumentFileResponseDto(contractId, FILE_NAME_PREFIX + contractId + PDF_EXTENSION, contractPdfGenerator.generate(contract, language));
    }

    private Contract findContract(long contractId) throws ContractNotFoundException {
        return contractRepository.findById(contractId).orElseThrow(() -> new ContractNotFoundException(contractId));
    }

    private LocalDateTime getSigningTime(Contract contract, ContractParty party) throws ContractAlreadySignedException {
        if (contract.isSignedBy(party)) {
            throw new ContractAlreadySignedException(contract.getId(), party);
        }

        return LocalDateTime.now(clock);
    }

    private void checkIfContractCanBeCreated(InternshipApplication application) throws ContractAlreadyExistsException, StudentAlreadyEmployedException, ApplicationRejectedException, ApplicationNotOfferedException {
        if (contractRepository.existsByStudentAndInternship(application.getStudent(), application.getInternship())) {
            throw new ContractAlreadyExistsException(application.getId());
        }

        EmployerDecision decision = application.getEmployerDecision();

        if (decision == EmployerDecision.REJECTED) {
            throw new ApplicationRejectedException(application.getId());
        }
        if (decision != EmployerDecision.INTERNSHIP_OFFERED) {
            throw new ApplicationNotOfferedException(application.getId());
        }

        Student student = application.getStudent();
        if (student.getStudentInternshipStatus() == StudentInternshipStatus.EMPLOYED) {
            throw new StudentAlreadyEmployedException(student.getId());
        }
    }
}
