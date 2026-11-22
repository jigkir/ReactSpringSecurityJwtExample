package com.lacouf.rsbjwt.service.dto.request.evaluation.intern;

import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.Evaluation;
import com.lacouf.rsbjwt.model.evaluation.intern.InternCriterion;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluation;
import com.lacouf.rsbjwt.model.evaluation.intern.InternEvaluationSection;
import com.lacouf.rsbjwt.model.evaluation.intern.NextInternshipInterest;
import com.lacouf.rsbjwt.model.evaluation.intern.OverallAppreciation;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

public record InternEvaluationFormDto(
        Map<InternCriterion, AgreementLevel> ratings,

        Map<InternEvaluationSection, @Size(max = Evaluation.MAX_TEXT_LENGTH) String> sectionComments,

        OverallAppreciation overallAppreciation,

        @Size(max = Evaluation.MAX_TEXT_LENGTH)
        String appreciationDetails,

        Boolean discussedWithIntern,

        @PositiveOrZero
        BigDecimal supervisionHoursPerWeek,

        NextInternshipInterest nextInternshipInterest,

        @Size(max = Evaluation.MAX_TEXT_LENGTH)
        String technicalTrainingComments,

        @Size(max = InternEvaluation.MAX_JOB_TITLE_LENGTH)
        String supervisorJobTitle
) {
    public InternEvaluationFormDto {
        ratings = ratings == null ? Map.of() : ratings;
        sectionComments = sectionComments == null ? Map.of() : sectionComments;
    }

    public static InternEvaluationFormDto of(InternEvaluation evaluation) {
        return new InternEvaluationFormDto(
                Map.copyOf(evaluation.getRatings()),
                Map.copyOf(evaluation.getSectionComments()),
                evaluation.getOverallAppreciation(),
                evaluation.getAppreciationDetails(),
                evaluation.getDiscussedWithIntern(),
                evaluation.getSupervisionHoursPerWeek(),
                evaluation.getNextInternshipInterest(),
                evaluation.getTechnicalTrainingComments(),
                evaluation.getSupervisorJobTitle()
        );
    }
}
