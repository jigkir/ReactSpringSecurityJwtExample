package com.lacouf.rsbjwt.service.contract;

import com.lacouf.rsbjwt.exception.contract.*;
import com.lacouf.rsbjwt.model.application.EmployerDecision;
import com.lacouf.rsbjwt.model.application.InternshipApplication;
import com.lacouf.rsbjwt.model.contract.Contract;
import com.lacouf.rsbjwt.model.user.Student;
import com.lacouf.rsbjwt.model.user.StudentInternshipStatus;
import com.lacouf.rsbjwt.repository.contract.ContractRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class ContractService {

    private final ContractRepository contractRepository;
    private final Clock clock;

    public ContractService(ContractRepository contractRepository, Clock clock) {
        this.contractRepository = contractRepository;
        this.clock = clock;
    }

    @Transactional
    public Contract createContract(InternshipApplication application) throws ContractAlreadyExistsException, StudentAlreadyEmployedException, ApplicationRejectedException, ApplicationNotOfferedException {
        checkIfContractCanBeCreated(application);

        return contractRepository.save(new Contract(application, LocalDateTime.now(clock)));
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
