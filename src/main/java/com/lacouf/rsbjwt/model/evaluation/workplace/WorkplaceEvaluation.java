package com.lacouf.rsbjwt.model.evaluation.workplace;

import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.Evaluation;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Getter
@Entity
public class WorkplaceEvaluation extends Evaluation {
    @ElementCollection
    @CollectionTable(name = "workplace_evaluation_rating", joinColumns = @JoinColumn(name = "evaluation_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "criterion")
    @Enumerated(EnumType.STRING)
    @Column(name = "rating", nullable = false)
    private Map<WorkplaceCriterion, AgreementLevel> ratings = new EnumMap<>(WorkplaceCriterion.class);

    private BigDecimal firstMonthSupervisionHours;
    private BigDecimal secondMonthSupervisionHours;
    private BigDecimal thirdMonthSupervisionHours;
    private BigDecimal hourlySalary;

    @Column(length = MAX_TEXT_LENGTH)
    private String comments;

    @Enumerated(EnumType.STRING)
    private PreferredInternship preferredInternship;

    @Enumerated(EnumType.STRING)
    private InternCapacity internCapacity;

    private Boolean welcomesSameInternAgain;
    private Boolean offersVariableShifts;

    @ElementCollection
    @CollectionTable(name = "workplace_evaluation_shift", joinColumns = @JoinColumn(name = "evaluation_id"))
    @OrderColumn(name = "shift_order")
    private List<ShiftRange> shiftRanges = new ArrayList<>();

    protected WorkplaceEvaluation() {
    }

    public WorkplaceEvaluation(InternshipTracking tracking) {
        super(tracking);
    }

    public void update(Map<WorkplaceCriterion, AgreementLevel> ratings, BigDecimal firstMonthSupervisionHours, BigDecimal secondMonthSupervisionHours,
                       BigDecimal thirdMonthSupervisionHours, BigDecimal hourlySalary, String comments, PreferredInternship preferredInternship,
                       InternCapacity internCapacity, Boolean welcomesSameInternAgain, Boolean offersVariableShifts, List<ShiftRange> shiftRanges,
                       LocalDateTime updatedAt) {
        replaceAnswers(this.ratings, ratings);
        this.firstMonthSupervisionHours = firstMonthSupervisionHours;
        this.secondMonthSupervisionHours = secondMonthSupervisionHours;
        this.thirdMonthSupervisionHours = thirdMonthSupervisionHours;
        this.hourlySalary = hourlySalary;
        this.comments = comments;
        this.preferredInternship = preferredInternship;
        this.internCapacity = internCapacity;
        this.welcomesSameInternAgain = welcomesSameInternAgain;
        this.offersVariableShifts = offersVariableShifts;

        this.shiftRanges.clear();

        if (Boolean.TRUE.equals(offersVariableShifts)) {
            this.shiftRanges.addAll(shiftRanges);
        }

        markAsUpdated(updatedAt);
    }

    @Override
    public boolean isComplete() {
        return ratesEvery(WorkplaceCriterion.class, ratings)
                && specifiesSupervisionHours()
                && specifiesHourlySalary()
                && explainsDisagreements()
                && answersGeneralObservations()
                && specifiesShiftsWhenVariable();
    }

    private boolean specifiesSupervisionHours() {
        return firstMonthSupervisionHours != null && secondMonthSupervisionHours != null && thirdMonthSupervisionHours != null;
    }

    private boolean specifiesHourlySalary() {
        return hourlySalary != null || ratings.get(WorkplaceCriterion.SALARY_INTERESTING) == AgreementLevel.CANNOT_SAY;
    }

    private boolean explainsDisagreements() {
        return ratings.values().stream().noneMatch(AgreementLevel::isDisagreement) || hasText(comments);
    }

    private boolean answersGeneralObservations() {
        return preferredInternship != null && internCapacity != null && welcomesSameInternAgain != null && offersVariableShifts != null;
    }

    private boolean specifiesShiftsWhenVariable() {
        return !Boolean.TRUE.equals(offersVariableShifts) || !shiftRanges.isEmpty();
    }
}
