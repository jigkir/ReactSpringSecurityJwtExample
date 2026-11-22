package com.lacouf.rsbjwt.model.evaluation.intern;

import com.lacouf.rsbjwt.model.evaluation.AgreementLevel;
import com.lacouf.rsbjwt.model.evaluation.Evaluation;
import com.lacouf.rsbjwt.model.internship_tracking.InternshipTracking;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;

@Getter
@Entity
public class InternEvaluation extends Evaluation {
    public static final int MAX_JOB_TITLE_LENGTH = 100;

    @ElementCollection
    @CollectionTable(name = "intern_evaluation_rating", joinColumns = @JoinColumn(name = "evaluation_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "criterion")
    @Enumerated(EnumType.STRING)
    @Column(name = "rating", nullable = false)
    private Map<InternCriterion, AgreementLevel> ratings = new EnumMap<>(InternCriterion.class);

    @ElementCollection
    @CollectionTable(name = "intern_evaluation_comment", joinColumns = @JoinColumn(name = "evaluation_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "evaluation_section")
    @Column(name = "comment", nullable = false, length = MAX_TEXT_LENGTH)
    private Map<InternEvaluationSection, String> sectionComments = new EnumMap<>(InternEvaluationSection.class);

    @Enumerated(EnumType.STRING)
    private OverallAppreciation overallAppreciation;

    @Column(length = MAX_TEXT_LENGTH)
    private String appreciationDetails;

    private Boolean discussedWithIntern;

    private BigDecimal supervisionHoursPerWeek;

    @Enumerated(EnumType.STRING)
    private NextInternshipInterest nextInternshipInterest;

    @Column(length = MAX_TEXT_LENGTH)
    private String technicalTrainingComments;

    @Column(length = MAX_JOB_TITLE_LENGTH)
    private String supervisorJobTitle;

    protected InternEvaluation() {
    }

    public InternEvaluation(InternshipTracking tracking) {
        super(tracking);
    }

    public void update(Map<InternCriterion, AgreementLevel> ratings, Map<InternEvaluationSection, String> sectionComments,
                       OverallAppreciation overallAppreciation, String appreciationDetails, Boolean discussedWithIntern,
                       BigDecimal supervisionHoursPerWeek, NextInternshipInterest nextInternshipInterest,
                       String technicalTrainingComments, String supervisorJobTitle, LocalDateTime updatedAt) {
        replaceAnswers(this.ratings, ratings);
        replaceAnswers(this.sectionComments, sectionComments);
        this.overallAppreciation = overallAppreciation;
        this.appreciationDetails = appreciationDetails;
        this.discussedWithIntern = discussedWithIntern;
        this.supervisionHoursPerWeek = supervisionHoursPerWeek;
        this.nextInternshipInterest = nextInternshipInterest;
        this.technicalTrainingComments = technicalTrainingComments;
        this.supervisorJobTitle = supervisorJobTitle;

        markAsUpdated(updatedAt);
    }

    @Override
    public boolean isComplete() {
        return ratesEvery(InternCriterion.class, ratings)
                && overallAppreciation != null
                && hasText(appreciationDetails)
                && discussedWithIntern != null
                && supervisionHoursPerWeek != null
                && nextInternshipInterest != null
                && hasText(technicalTrainingComments)
                && hasText(supervisorJobTitle);
    }

    @Override
    public NotificationType getToFillNotification() {
        return NotificationType.INTERN_EVALUATION_TO_FILL;
    }

    @Override
    public NotificationType getSignedNotification() {
        return NotificationType.INTERN_EVALUATION_SIGNED;
    }
}
