package com.lacouf.rsbjwt.model.evaluation.intern;

import java.util.Arrays;
import java.util.List;

public enum InternCriterion {
    PLAN_AND_ORGANIZE_WORK(InternEvaluationSection.PRODUCTIVITY),
    UNDERSTAND_INSTRUCTIONS_QUICKLY(InternEvaluationSection.PRODUCTIVITY),
    KEEP_STEADY_PACE(InternEvaluationSection.PRODUCTIVITY),
    SET_PRIORITIES(InternEvaluationSection.PRODUCTIVITY),
    MEET_DEADLINES(InternEvaluationSection.PRODUCTIVITY),

    FULFILL_MANDATES(InternEvaluationSection.WORK_QUALITY),
    PAY_ATTENTION_TO_DETAILS(InternEvaluationSection.WORK_QUALITY),
    CHECK_OWN_WORK(InternEvaluationSection.WORK_QUALITY),
    SEEK_IMPROVEMENT(InternEvaluationSection.WORK_QUALITY),
    ANALYZE_PROBLEMS(InternEvaluationSection.WORK_QUALITY),

    MAKE_CONTACTS_EASILY(InternEvaluationSection.INTERPERSONAL_RELATIONS),
    CONTRIBUTE_TO_TEAMWORK(InternEvaluationSection.INTERPERSONAL_RELATIONS),
    ADAPT_TO_COMPANY_CULTURE(InternEvaluationSection.INTERPERSONAL_RELATIONS),
    ACCEPT_CONSTRUCTIVE_CRITICISM(InternEvaluationSection.INTERPERSONAL_RELATIONS),
    BE_RESPECTFUL(InternEvaluationSection.INTERPERSONAL_RELATIONS),
    LISTEN_ACTIVELY(InternEvaluationSection.INTERPERSONAL_RELATIONS),

    SHOW_INTEREST_AND_MOTIVATION(InternEvaluationSection.PERSONAL_SKILLS),
    EXPRESS_IDEAS_CLEARLY(InternEvaluationSection.PERSONAL_SKILLS),
    SHOW_INITIATIVE(InternEvaluationSection.PERSONAL_SKILLS),
    WORK_SAFELY(InternEvaluationSection.PERSONAL_SKILLS),
    SHOW_RESPONSIBILITY(InternEvaluationSection.PERSONAL_SKILLS),
    BE_PUNCTUAL_AND_ASSIDUOUS(InternEvaluationSection.PERSONAL_SKILLS);

    private final InternEvaluationSection section;

    InternCriterion(InternEvaluationSection section) {
        this.section = section;
    }

    public static List<InternCriterion> of(InternEvaluationSection section) {
        return Arrays.stream(values())
                .filter(criterion -> criterion.section == section)
                .toList();
    }
}
