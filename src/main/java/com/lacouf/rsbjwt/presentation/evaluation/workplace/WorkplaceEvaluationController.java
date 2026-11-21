package com.lacouf.rsbjwt.presentation.evaluation.workplace;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.signature.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.request.signature.SignatureRequestDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;
import com.lacouf.rsbjwt.service.evaluation.workplace.WorkplaceEvaluationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher/workplace-evaluations")
public class WorkplaceEvaluationController {
    private final WorkplaceEvaluationService workplaceEvaluationService;

    public WorkplaceEvaluationController(WorkplaceEvaluationService workplaceEvaluationService) {
        this.workplaceEvaluationService = workplaceEvaluationService;
    }

    @GetMapping("")
    public ResponseEntity<List<EvaluationResponseDto<WorkplaceEvaluationFormDto>>> getEvaluations(Authentication authentication, @RequestParam(required = false) Long sessionId) throws AcademicSessionNotFoundException {
        return ResponseEntity.ok(workplaceEvaluationService.getEvaluations(authentication.getName(), sessionId));
    }

    @GetMapping("/to-sign")
    public ResponseEntity<List<EvaluationResponseDto<WorkplaceEvaluationFormDto>>> getEvaluationsToSign(Authentication authentication) {
        return ResponseEntity.ok(workplaceEvaluationService.getEvaluationsToSign(authentication.getName()));
    }

    @PutMapping("/{evaluationId}")
    public ResponseEntity<EvaluationResponseDto<WorkplaceEvaluationFormDto>> saveEvaluation(Authentication authentication, @PathVariable long evaluationId, @Valid @RequestBody WorkplaceEvaluationFormDto form) throws EvaluationNotFoundException, EvaluationAlreadySignedException {
        return ResponseEntity.ok(workplaceEvaluationService.saveEvaluation(authentication.getName(), evaluationId, form));
    }

    @PutMapping("/{evaluationId}/signature")
    public ResponseEntity<EvaluationResponseDto<WorkplaceEvaluationFormDto>> signEvaluation(Authentication authentication, @PathVariable long evaluationId, @Valid @RequestBody SignatureRequestDto signature) throws EvaluationNotFoundException, UserNotFoundException, IncorrectSignaturePasswordException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        return ResponseEntity.ok(workplaceEvaluationService.signEvaluation(authentication.getName(), evaluationId, signature.password()));
    }

    @GetMapping("/{evaluationId}/file")
    public ResponseEntity<DocumentFileResponseDto> getEvaluationFile(Authentication authentication, @PathVariable long evaluationId, @RequestParam DocumentLanguage language) throws EvaluationNotFoundException {
        return ResponseEntity.ok(workplaceEvaluationService.getEvaluationFile(authentication.getName(), evaluationId, language));
    }
}
