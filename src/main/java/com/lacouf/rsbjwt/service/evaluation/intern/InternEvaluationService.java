package com.lacouf.rsbjwt.service.evaluation.intern;

import com.lacouf.rsbjwt.exception.evaluation.EvaluationAlreadySignedException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationIncompleteException;
import com.lacouf.rsbjwt.exception.evaluation.EvaluationNotFoundException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.signature.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluation;
import com.lacouf.rsbjwt.model.session.AcademicSession;
import com.lacouf.rsbjwt.repository.evaluation.intern.InternEvaluationRepository;
import com.lacouf.rsbjwt.service.dto.request.evaluation.intern.InternEvaluationFormDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import com.lacouf.rsbjwt.service.dto.response.evaluation.EvaluationResponseDto;
import com.lacouf.rsbjwt.service.evaluation.EvaluationService;
import com.lacouf.rsbjwt.service.session.AcademicSessionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InternEvaluationService {
    private static final String FILE_NAME_PREFIX = "evaluation-stagiaire-";

    private final InternEvaluationRepository internEvaluationRepository;

    private final EvaluationService evaluationService;
    private final AcademicSessionService academicSessionService;
    private final InternEvaluationPdfGenerator internEvaluationPdfGenerator;

    public InternEvaluationService(InternEvaluationRepository internEvaluationRepository, EvaluationService evaluationService, AcademicSessionService academicSessionService, InternEvaluationPdfGenerator internEvaluationPdfGenerator) {
        this.internEvaluationRepository = internEvaluationRepository;
        this.evaluationService = evaluationService;
        this.academicSessionService = academicSessionService;
        this.internEvaluationPdfGenerator = internEvaluationPdfGenerator;
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponseDto<InternEvaluationFormDto>> getEvaluations(String email, Long sessionId) throws AcademicSessionNotFoundException {
        AcademicSession session = academicSessionService.findSessionOrCurrent(sessionId);

        return toResponses(internEvaluationRepository.findByTracking_Internship_PostedBy_Credentials_EmailAndTracking_Internship_Session(email, session));
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponseDto<InternEvaluationFormDto>> getEvaluationsToSign(String email) {
        return toResponses(internEvaluationRepository.findByTracking_Internship_PostedBy_Credentials_EmailAndSignedAtIsNull(email));
    }

    @Transactional
    public EvaluationResponseDto<InternEvaluationFormDto> saveEvaluation(String email, long evaluationId, InternEvaluationFormDto form) throws EvaluationNotFoundException, EvaluationAlreadySignedException {
        InternEvaluation evaluation = findEvaluationOf(email, evaluationId);

        evaluation.update(form.ratings(), form.sectionComments(), form.overallAppreciation(), form.appreciationDetails(),
                form.discussedWithIntern(), form.supervisionHoursPerWeek(), form.nextInternshipInterest(),
                form.technicalTrainingComments(), form.supervisorJobTitle(), evaluationService.getUpdateTime(evaluation));

        return saveAsResponse(evaluation);
    }

    @Transactional
    public EvaluationResponseDto<InternEvaluationFormDto> signEvaluation(String email, long evaluationId, String password) throws EvaluationNotFoundException, UserNotFoundException, IncorrectSignaturePasswordException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        InternEvaluation evaluation = findEvaluationOf(email, evaluationId);

        evaluationService.sign(evaluation, email, password);

        return saveAsResponse(evaluation);
    }

    @Transactional
    public EvaluationResponseDto<InternEvaluationFormDto> devSignEvaluation(String email, long evaluationId) throws EvaluationNotFoundException, EvaluationAlreadySignedException, EvaluationIncompleteException {
        InternEvaluation evaluation = findEvaluationOf(email, evaluationId);

        evaluationService.signWithoutPassword(evaluation);

        return saveAsResponse(evaluation);
    }

    @Transactional(readOnly = true)
    public DocumentFileResponseDto getEvaluationFile(String email, long evaluationId, DocumentLanguage language) throws EvaluationNotFoundException {
        InternEvaluation evaluation = findEvaluationOf(email, evaluationId);

        return evaluationService.toFile(evaluation, FILE_NAME_PREFIX, internEvaluationPdfGenerator.generate(evaluation, language));
    }

    private InternEvaluation findEvaluationOf(String email, long evaluationId) throws EvaluationNotFoundException {
        return internEvaluationRepository.findByIdAndTracking_Internship_PostedBy_Credentials_Email(evaluationId, email)
                .orElseThrow(() -> new EvaluationNotFoundException(evaluationId));
    }

    private EvaluationResponseDto<InternEvaluationFormDto> saveAsResponse(InternEvaluation evaluation) {
        return toResponse(internEvaluationRepository.save(evaluation));
    }

    private List<EvaluationResponseDto<InternEvaluationFormDto>> toResponses(List<InternEvaluation> evaluations) {
        return evaluations.stream()
                .map(this::toResponse)
                .toList();
    }

    private EvaluationResponseDto<InternEvaluationFormDto> toResponse(InternEvaluation evaluation) {
        return EvaluationResponseDto.of(evaluation, InternEvaluationFormDto.of(evaluation));
    }
}
