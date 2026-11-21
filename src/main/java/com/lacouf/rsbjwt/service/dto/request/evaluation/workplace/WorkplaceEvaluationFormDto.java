package com.lacouf.rsbjwt.service.dto.request.evaluation.workplace;

import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.Evaluation;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceCriterion;
import com.lacouf.rsbjwt.model.evaluation.workplace.WorkplaceEvaluation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record WorkplaceEvaluationFormDto(
        Map<WorkplaceCriterion, AgreementLevel> ratings,

        @Valid
        SupervisionHoursDto supervisionHoursPerWeek,

        @PositiveOrZero
        BigDecimal hourlySalary,

        @Size(max = Evaluation.MAX_TEXT_LENGTH)
        String comments,

        @Valid
        WorkplaceObservationsDto generalObservations
) {
    public WorkplaceEvaluationFormDto {
        ratings = ratings == null ? Map.of() : ratings;
        supervisionHoursPerWeek = supervisionHoursPerWeek == null ? SupervisionHoursDto.EMPTY : supervisionHoursPerWeek;
        generalObservations = generalObservations == null ? WorkplaceObservationsDto.EMPTY : generalObservations;
    }

    public static WorkplaceEvaluationFormDto of(WorkplaceEvaluation evaluation) {
        return new WorkplaceEvaluationFormDto(
                Map.copyOf(evaluation.getRatings()),
                new SupervisionHoursDto(evaluation.getFirstMonthSupervisionHours(), evaluation.getSecondMonthSupervisionHours(), evaluation.getThirdMonthSupervisionHours()),
                evaluation.getHourlySalary(),
                evaluation.getComments(),
                new WorkplaceObservationsDto(evaluation.getPreferredInternship(), evaluation.getInternCapacity(),
                        evaluation.getWelcomesSameInternAgain(), evaluation.getOffersVariableShifts(), List.copyOf(evaluation.getShiftRanges()))
        );
    }
}
