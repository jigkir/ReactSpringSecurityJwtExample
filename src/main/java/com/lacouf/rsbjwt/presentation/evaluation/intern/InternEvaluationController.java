package com.lacouf.rsbjwt.presentation.evaluation.intern;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.signature.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.request.evaluation.intern.InternEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.request.signature.SignatureRequestDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;
import com.lacouf.rsbjwt.service.evaluation.intern.InternEvaluationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employer/intern-evaluations")
public class InternEvaluationController {
    private final InternEvaluationService internEvaluationService;

    public InternEvaluationController(InternEvaluationService internEvaluationService) {
        this.internEvaluationService = internEvaluationService;
    }

    @GetMapping("")
    public ResponseEntity<List<EvaluationResponseDto<InternEvaluationFormDto>>> getEvaluations(Authentication authentication, @RequestParam(required = false) Long sessionId) throws AcademicSessionNotFoundException {
        return ResponseEntity.ok(internEvaluationService.getEvaluations(authentication.getName(), sessionId));
    }

    @GetMapping("/to-sign")
    public ResponseEntity<List<EvaluationResponseDto<InternEvaluationFormDto>>> getEvaluationsToSign(Authentication authentication) {
        return ResponseEntity.ok(internEvaluationService.getEvaluationsToSign(authentication.getName()));
    }

    @PutMapping("/{evaluationId}")
    public ResponseEntity<EvaluationResponseDto<InternEvaluationFormDto>> saveEvaluation(Authentication authentication, @PathVariable long evaluationId, @Valid @RequestBody InternEvaluationFormDto form) throws EvaluationNotFoundException, EvaluationAlreadySignedException {
        return ResponseEntity.ok(internEvaluationService.saveEvaluation(authentication.getName(), evaluationId, form));
    }

    @PutMapping("/{evaluationId}/signature")
    public ResponseEntity<EvaluationResponseDto<InternEvaluationFormDto>> signEvaluation(Authentication authentication, @PathVariable long evaluationId, @Valid @RequestBody SignatureRequestDto signature) throws EvaluationNotFoundException, UserNotFoundException, IncorrectSignaturePasswordException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        return ResponseEntity.ok(internEvaluationService.signEvaluation(authentication.getName(), evaluationId, signature.password()));
    }
}
