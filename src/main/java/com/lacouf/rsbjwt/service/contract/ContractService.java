package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.exception.contract.ApplicationRejectedException;
import com.lacouf.rsbjwt.exception.contract.ContractAlreadyExistsException;
import com.lacouf.rsbjwt.exception.contract.StudentAlreadyEmployedException;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.contract.ContractStatus;
import com.lacouf.rsbjwt.model.contract.StudentConsent;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.StudentInternshipStatus;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public void studentAcceptsContract(Contract contract) {
        InternshipApplication internshipApplication = contract.getInternshipApplication();
        Student student = internshipApplication.getStudent();

        contract.setStudentConsent(StudentConsent.ACCEPTED);

        contract.setContractStatus(ContractStatus.ACTIVE);

        student.setStudentInternshipStatus(StudentInternshipStatus.EMPLOYED);

        contractRepository.save(contract);
    }

    @Transactional
    public void studentRejectsContract(Contract contract) {
        contract.setStudentConsent(StudentConsent.REJECTED);
        contract.setContractStatus(ContractStatus.TERMINATED);

        contractRepository.save(contract);
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
