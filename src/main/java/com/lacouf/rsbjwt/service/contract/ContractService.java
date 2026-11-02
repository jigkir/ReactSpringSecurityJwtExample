package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.exception.contract.*;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractStatus;
import com.lacouf.rsbjwt.model.contract.StudentConsent;
import com.lacouf.rsbjwt.model.user.Employer;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.StudentInternshipStatus;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import com.lacouf.rsbjwt.service.dto.response.contracts.ContractResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ContractService {

    private final ContractRepository contractRepository;

    public ContractService(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    @Transactional
    public void createContract(InternshipApplication internshipApplication) throws ContractAlreadyExistsException, StudentAlreadyEmployedException, ApplicationRejectedException {
        checkIfContractCanBeCreated(internshipApplication);

        Contract contract = new Contract(internshipApplication);
        contractRepository.save(contract);
    }

    @Transactional(readOnly = true)
    public List<ContractResponseDto> getContractsOfStudent(Student student) {
        return contractRepository.findByInternshipApplication_Student(student).stream()
                .filter(contract -> !contract.getInternshipApplication().getInternship().isDeleted())
                .map(ContractResponseDto::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponseDto> getContractsOfEmployer(Employer employer) {
        return contractRepository.findByInternshipApplication_Internship_PostedBy(employer).stream()
                .filter(contract -> !contract.getInternshipApplication().getInternship().isDeleted())
                .map(ContractResponseDto::of)
                .toList();
    }

    @Transactional
    public void studentAcceptsContract(long contractId, String email) throws ContractNotFoundException, ContractNotPendingException, StudentAlreadyEmployedException {
        Contract contract = findPendingContract(contractId, email);
        Student student = contract.getInternshipApplication().getStudent();

        if (student.getStudentInternshipStatus() == StudentInternshipStatus.EMPLOYED) {
            throw new StudentAlreadyEmployedException(student.getId());
        }

        contract.setStudentConsent(StudentConsent.ACCEPTED);
        contract.setContractStatus(ContractStatus.ACTIVE);
        student.setStudentInternshipStatus(StudentInternshipStatus.EMPLOYED);

        terminateOtherPendingContracts(student, contract);
    }

    @Transactional
    public void studentRejectsContract(long contractId, String email) throws ContractNotFoundException, ContractNotPendingException {
        Contract contract = findPendingContract(contractId, email);

        contract.setStudentConsent(StudentConsent.REJECTED);
        contract.setContractStatus(ContractStatus.TERMINATED);
    }

    private Contract findPendingContract(long contractId, String email) throws ContractNotFoundException, ContractNotPendingException {
        Contract contract = contractRepository.findByIdAndInternshipApplication_Student_Credentials_Email(contractId, email)
                .orElseThrow(() -> new ContractNotFoundException(contractId));

        if (contract.getInternshipApplication().getInternship().isDeleted()) {
            throw new ContractNotFoundException(contractId);
        }
        if (contract.getContractStatus() != ContractStatus.PENDING) {
            throw new ContractNotPendingException(contractId);
        }
        return contract;
    }

    private void terminateOtherPendingContracts(Student student, Contract accepted) {
        contractRepository.findByInternshipApplication_StudentAndContractStatus(student, ContractStatus.PENDING).stream()
                .filter(other -> !other.getId().equals(accepted.getId()))
                .forEach(other -> {
                    other.setStudentConsent(StudentConsent.REJECTED);
                    other.setContractStatus(ContractStatus.TERMINATED);
                });
    }

    @Transactional
    public void terminateForRejection(InternshipApplication application) throws ContractAlreadyActiveException {
        Optional<Contract> contract = contractRepository.findByInternshipApplication(application);
        if (contract.isEmpty()) {
            return;
        }
        if (contract.get().getContractStatus() == ContractStatus.ACTIVE) {
            throw new ContractAlreadyActiveException(contract.get().getId());
        }
        contract.get().setContractStatus(ContractStatus.TERMINATED);
    }

    private void checkIfContractCanBeCreated(InternshipApplication internshipApplication) throws ContractAlreadyExistsException, StudentAlreadyEmployedException, ApplicationRejectedException {
        if (contractRepository.existsByInternshipApplicationId(internshipApplication.getId())) {
            throw new ContractAlreadyExistsException(internshipApplication.getId());
        }

        if (internshipApplication.getEmployerDecision() == EmployerDecision.REJECTED) {
            throw new ApplicationRejectedException(internshipApplication.getId());
        }

        Student student = internshipApplication.getStudent();

        if (student.getStudentInternshipStatus() == StudentInternshipStatus.EMPLOYED) {
            throw new StudentAlreadyEmployedException(student.getId());
        }
    }
}
