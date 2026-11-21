package com.lacouf.rsbjwt.service.evaluation.workplace;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.signature.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.repository.evaluation.workplace.WorkplaceEvaluationRepository;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.SupervisionHoursDto;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.request.evaluation.workplace.WorkplaceObservationsDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;
import com.lacouf.rsbjwt.service.evaluation.EvaluationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WorkplaceEvaluationService {
    private static final String FILE_NAME_PREFIX = "evaluation-milieu-de-stage-";

    private final WorkplaceEvaluationRepository workplaceEvaluationRepository;

    private final EvaluationService evaluationService;
    private final AcademicSessionService academicSessionService;
    private final WorkplaceEvaluationPdfGenerator workplaceEvaluationPdfGenerator;

    public WorkplaceEvaluationService(WorkplaceEvaluationRepository workplaceEvaluationRepository, EvaluationService evaluationService, AcademicSessionService academicSessionService, WorkplaceEvaluationPdfGenerator workplaceEvaluationPdfGenerator) {
        this.workplaceEvaluationRepository = workplaceEvaluationRepository;
        this.evaluationService = evaluationService;
        this.academicSessionService = academicSessionService;
        this.workplaceEvaluationPdfGenerator = workplaceEvaluationPdfGenerator;
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponseDto<WorkplaceEvaluationFormDto>> getEvaluations(String email, Long sessionId) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);

        return toResponses(workplaceEvaluationRepository.findByTracking_Teacher_Credentials_EmailAndTracking_Internship_Session(email, session));
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponseDto<WorkplaceEvaluationFormDto>> getEvaluationsToSign(String email) {
        return toResponses(workplaceEvaluationRepository.findByTracking_Teacher_Credentials_EmailAndSignedAtIsNull(email));
    }

    @Transactional
    public EvaluationResponseDto<WorkplaceEvaluationFormDto> saveEvaluation(String email, long evaluationId, WorkplaceEvaluationFormDto form) throws EvaluationNotFoundException, EvaluationAlreadySignedException {
        WorkplaceEvaluation evaluation = findEvaluationOf(email, evaluationId);
        SupervisionHoursDto supervisionHours = form.supervisionHoursPerWeek();
        WorkplaceObservationsDto observations = form.generalObservations();

        evaluation.update(form.ratings(), supervisionHours.month1(), supervisionHours.month2(), supervisionHours.month3(),
                form.hourlySalary(), form.comments(), observations.preferredForStage(), observations.openToInternCount(),
                observations.wouldWelcomeSameInternAgain(), observations.variableShifts(), observations.shiftRanges(),
                evaluationService.getUpdateTime(evaluation));

        return saveAsResponse(evaluation);
    }

    @Transactional
    public EvaluationResponseDto<WorkplaceEvaluationFormDto> signEvaluation(String email, long evaluationId, String password) throws EvaluationNotFoundException, UserNotFoundException, IncorrectSignaturePasswordException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        WorkplaceEvaluation evaluation = findEvaluationOf(email, evaluationId);

        evaluationService.sign(evaluation, email, password);

        return saveAsResponse(evaluation);
    }

    @Transactional
    public EvaluationResponseDto<WorkplaceEvaluationFormDto> devSignEvaluation(String email, long evaluationId) throws EvaluationNotFoundException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        WorkplaceEvaluation evaluation = findEvaluationOf(email, evaluationId);

        evaluationService.signWithoutPassword(evaluation);

        return saveAsResponse(evaluation);
    }

    @Transactional(readOnly = true)
    public DocumentFileResponseDto getEvaluationFile(String email, long evaluationId, DocumentLanguage language) throws EvaluationNotFoundException {
        WorkplaceEvaluation evaluation = findEvaluationOf(email, evaluationId);

        return evaluationService.toFile(evaluation, FILE_NAME_PREFIX, workplaceEvaluationPdfGenerator.generate(evaluation, language));
    }

    private WorkplaceEvaluation findEvaluationOf(String email, long evaluationId) throws EvaluationNotFoundException {
        return workplaceEvaluationRepository.findByIdAndTracking_Teacher_Credentials_Email(evaluationId, email)
                .orElseThrow(() -> new EvaluationNotFoundException(evaluationId));
    }

    private EvaluationResponseDto<WorkplaceEvaluationFormDto> saveAsResponse(WorkplaceEvaluation evaluation) {
        return toResponse(workplaceEvaluationRepository.save(evaluation));
    }

    private List<EvaluationResponseDto<WorkplaceEvaluationFormDto>> toResponses(List<WorkplaceEvaluation> evaluations) {
        return evaluations.stream()
                .map(this::toResponse)
                .toList();
    }

    private EvaluationResponseDto<WorkplaceEvaluationFormDto> toResponse(WorkplaceEvaluation evaluation) {
        return EvaluationResponseDto.of(evaluation, WorkplaceEvaluationFormDto.of(evaluation));
    }
}
