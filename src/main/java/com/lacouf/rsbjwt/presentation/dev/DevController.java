package com.lacouf.rsbjwt.presentation.dev;

import com.lacouf.rsbjwt.exception.contract.ContractAlreadySignedException;
import com.lacouf.rsbjwt.exception.contract.ContractNotFoundException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.contract.ContractService;
import com.lacouf.rsbjwt.service.dto.request.evaluation.intern.InternEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.response.auth.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.evaluation.intern.InternEvaluationService;
import com.lacouf.rsbjwt.service.evaluation.workplace.WorkplaceEvaluationService;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dev")
public class DevController {
    private final UserAppService userAppService;
    private final ContractService contractService;
    private final WorkplaceEvaluationService workplaceEvaluationService;
    private final InternEvaluationService internEvaluationService;

    public DevController(UserAppService userAppService, ContractService contractService, WorkplaceEvaluationService workplaceEvaluationService, InternEvaluationService internEvaluationService) {
        this.userAppService = userAppService;
        this.contractService = contractService;
        this.workplaceEvaluationService = workplaceEvaluationService;
        this.internEvaluationService = internEvaluationService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userAppService.getAllDevUsers());
    }

    @PostMapping("/login-as")
    public ResponseEntity<JWTAuthResponse> loginAs(@RequestParam String email) throws UserNotFoundException {
        return ResponseEntity.ok(userAppService.devLoginAs(email));
    }

    @PutMapping("/contracts/{contractId}/signature")
    public ResponseEntity<ContractResponseDto> signContract(@PathVariable long contractId, @RequestParam String email) throws UserNotFoundException, ContractNotFoundException, ContractAlreadySignedException {
        return ResponseEntity.ok(contractService.devSignContract(email, contractId));
    }

    @PutMapping("/workplace-evaluations/{evaluationId}/signature")
    public ResponseEntity<EvaluationResponseDto<WorkplaceEvaluationFormDto>> signWorkplaceEvaluation(@PathVariable long evaluationId, @RequestParam String email) throws EvaluationNotFoundException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        return ResponseEntity.ok(workplaceEvaluationService.devSignEvaluation(email, evaluationId));
    }

    @PutMapping("/intern-evaluations/{evaluationId}/signature")
    public ResponseEntity<EvaluationResponseDto<InternEvaluationFormDto>> signInternEvaluation(@PathVariable long evaluationId, @RequestParam String email) throws EvaluationNotFoundException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        return ResponseEntity.ok(internEvaluationService.devSignEvaluation(email, evaluationId));
    }
}