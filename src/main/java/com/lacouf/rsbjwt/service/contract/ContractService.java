package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.exception.contract.*;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractLanguage;
import com.lacouf.rsbjwt.model.contract.ContractParty;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.StudentInternshipStatus;
import com.lacouf.rsbjwt.model.user.UserApp;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import com.lacouf.rsbjwt.repository.users.ManagerRepository;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import com.lacouf.rsbjwt.service.users.UserAppService;
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
    private final ManagerRepository managerRepository;

    private final UserAppService userAppService;
    private final AcademicSessionService academicSessionService;
    private final NotificationService notificationService;

    private final Clock clock;

    public ContractService(ContractPdfGenerator contractPdfGenerator, ContractRepository contractRepository, ManagerRepository managerRepository, UserAppService userAppService, AcademicSessionService academicSessionService, NotificationService notificationService, Clock clock) {
        this.contractPdfGenerator = contractPdfGenerator;
        this.contractRepository = contractRepository;
        this.managerRepository = managerRepository;
        this.userAppService = userAppService;
        this.academicSessionService = academicSessionService;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    @Transactional
    public void createContract(InternshipApplication application) throws ContractAlreadyExistsException, StudentAlreadyEmployedException, ApplicationRejectedException, ApplicationNotOfferedException {
        checkIfContractCanBeCreated(application);

        Contract contract = contractRepository.save(new Contract(application, LocalDateTime.now(clock)));

        notifyManagersOfContractToSign(contract);
    }

    @Transactional(readOnly = true)
    public List<ContractResponseDto> getContracts(String email, Long sessionId) throws UserNotFoundException, AcademicSessionNotFoundException {
        UserApp user = userAppService.findUserByEmail(email);

        return contractRepository.findByInternship_Session(academicSessionService.findSessionOrCurrent(sessionId)).stream()
                .filter(contract -> contract.isPartyOf(user))
                .map(ContractResponseDto::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponseDto> getContractsToSign(String email) throws UserNotFoundException {
        UserApp user = userAppService.findUserByEmail(email);

        return contractRepository.findAll().stream()
                .filter(contract -> contract.isWaitingForSignatureOf(user))
                .map(ContractResponseDto::of)
                .toList();
    }

    @Transactional
    public ContractResponseDto signContract(String email, long contractId, String password) throws UserNotFoundException, IncorrectSignaturePasswordException, ContractNotFoundException, ContractAlreadySignedException {
        UserApp signer = userAppService.findUserByEmail(email);

        userAppService.verifyIfSignaturePasswordIsIncorrect(signer, password);

        return sign(contractId, signer);
    }

    // Dev Mode only (called from DevController): signs without password
    @Transactional
    public ContractResponseDto devSignContract(String email, long contractId) throws UserNotFoundException, ContractNotFoundException, ContractAlreadySignedException {
        return sign(contractId, userAppService.findUserByEmail(email));
    }

    @Transactional(readOnly = true)
    public DocumentFileResponseDto getContractFile(String email, long contractId, ContractLanguage language) throws UserNotFoundException, ContractNotFoundException {
        Contract contract = findContractOf(userAppService.findUserByEmail(email), contractId);

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

    private void notifyManagersOfContractToSign(Contract contract) {
        managerRepository.findAll()
                .forEach(manager -> notificationService.notifyIfAbsent(ContractParty.MANAGER.getContractToSignNotification(), contract.getId(), manager));
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

    private ContractResponseDto sign(long contractId, UserApp signer) throws ContractNotFoundException, ContractAlreadySignedException {
        Contract contract = findContract(contractId);
        ContractParty party = findPartyOf(contract, signer);

        contract.sign(party, signer, getSigningTime(contract, party));

        notificationService.closeNotificationsOfType(party.getContractToSignNotification(), contractId);

        return ContractResponseDto.of(contractRepository.save(contract));
    }

    private Contract findContractOf(UserApp user, long contractId) throws ContractNotFoundException {
        return contractRepository.findById(contractId)
                .filter(contract -> contract.isPartyOf(user))
                .orElseThrow(() -> new ContractNotFoundException(contractId));
    }

    private ContractParty findPartyOf(Contract contract, UserApp user) throws ContractNotFoundException {
        return contract.findPartyOf(user).orElseThrow(() -> new ContractNotFoundException(contract.getId()));
    }
}
