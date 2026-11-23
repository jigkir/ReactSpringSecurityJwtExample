package com.lacouf.rsbjwt.presentation.evaluation;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.service.dto.request.evaluation.intern.InternEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;
import com.lacouf.rsbjwt.service.evaluation.intern.InternEvaluationService;
import com.lacouf.rsbjwt.service.evaluation.workplace.WorkplaceEvaluationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerEvaluationController {
    private final WorkplaceEvaluationService workplaceEvaluationService;
    private final InternEvaluationService internEvaluationService;

    public ManagerEvaluationController(WorkplaceEvaluationService workplaceEvaluationService, InternEvaluationService internEvaluationService) {
        this.workplaceEvaluationService = workplaceEvaluationService;
        this.internEvaluationService = internEvaluationService;
    }

    @GetMapping("/workplace-evaluations")
    public ResponseEntity<List<EvaluationResponseDto<WorkplaceEvaluationFormDto>>> getWorkplaceEvaluations(@RequestParam(required = false) Long sessionId) throws AcademicSessionNotFoundException {
        return ResponseEntity.ok(workplaceEvaluationService.getSignedEvaluations(sessionId));
    }

    @GetMapping("/workplace-evaluations/{evaluationId}/file")
    public ResponseEntity<DocumentFileResponseDto> getWorkplaceEvaluationFile(@PathVariable long evaluationId, @RequestParam DocumentLanguage language) throws EvaluationNotFoundException {
        return ResponseEntity.ok(workplaceEvaluationService.getSignedEvaluationFile(evaluationId, language));
    }

    @GetMapping("/intern-evaluations")
    public ResponseEntity<List<EvaluationResponseDto<InternEvaluationFormDto>>> getInternEvaluations(@RequestParam(required = false) Long sessionId) throws AcademicSessionNotFoundException {
        return ResponseEntity.ok(internEvaluationService.getSignedEvaluations(sessionId));
    }

    @GetMapping("/intern-evaluations/{evaluationId}/file")
    public ResponseEntity<DocumentFileResponseDto> getInternEvaluationFile(@PathVariable long evaluationId, @RequestParam DocumentLanguage language) throws EvaluationNotFoundException {
        return ResponseEntity.ok(internEvaluationService.getSignedEvaluationFile(evaluationId, language));
    }
}
