/**
 * WorkplaceEvaluation.js — Constants, initial form state, and validation helpers
 * for the teacher's workplace evaluation form (Évaluation du milieu de stage).
 */

export const EVALUATION_RATINGS = [
    "TOTALLY_AGREE",
    "SOMEWHAT_AGREE",
    "SOMEWHAT_DISAGREE",
    "TOTALLY_DISAGREE",
    "CANNOT_SAY",
];

export const DISAGREE_RATINGS = new Set([
    "SOMEWHAT_DISAGREE",
    "TOTALLY_DISAGREE",
]);

export const PREFERRED_STAGE_OPTIONS = ["FIRST", "SECOND"];

export const INTERN_CAPACITY_OPTIONS = [
    "ONE",
    "TWO",
    "THREE",
    "MORE_THAN_THREE",
];

// Each criterion maps to formData.criteria[key] and i18n keys
export const EVALUATION_CRITERIA = [
    { key: "tasksMatchAgreement" },
    { key: "onboardingMeasures" },
    { key: "healthAndSafetyCompliant" },
    { key: "workClimatePleasant" },
    { key: "publicTransitAccessible" },
    { key: "supervisorCommunicationSmooth" },
    { key: "equipmentAdequate" },
    { key: "workloadAcceptable" },
    { key: "salaryInteresting", extra: "hourlySalary" },
    { key: "supervisionSufficient", extra: "supervisionHours" },
];

export const createEmptyShiftRange = () => ({ from: "", to: "" });

export const createInitialEvaluation = (existing = {}) => ({
    criteria: {
        tasksMatchAgreement: "",
        onboardingMeasures: "",
        supervisionSufficient: "",
        supervisionHoursPerWeek: {
            month1: "",
            month2: "",
            month3: "",
            ...existing.criteria?.supervisionHoursPerWeek,
        },
        healthAndSafetyCompliant: "",
        workClimatePleasant: "",
        publicTransitAccessible: "",
        salaryInteresting: "",
        hourlySalary: "",
        supervisorCommunicationSmooth: "",
        equipmentAdequate: "",
        workloadAcceptable: "",
        ...existing.criteria,
    },
    comments: existing.comments ?? "",
    generalObservations: {
        preferredForStage: "",
        openToInternCount: "",
        wouldWelcomeSameInternAgain: null,
        variableShifts: null,
        shiftRanges: existing.generalObservations?.shiftRanges?.length
            ? existing.generalObservations.shiftRanges
            : [createEmptyShiftRange()],
        ...existing.generalObservations,
    },
});

export const hasDisagreement = (criteria = {}) =>
    EVALUATION_CRITERIA.some(({ key }) => DISAGREE_RATINGS.has(criteria[key]));

/**
 * Validates the evaluation form before submission.
 * Returns an object of { fieldKey: translationKey } (empty object when valid).
 */
export function validateEvaluation(formData, { requireComplete = false } = {}) {
    if (!formData) {
        return requireComplete ? { form: "workplaceEvaluation.errors.ratingRequired" } : {};
    }
    const normalized = createInitialEvaluation(formData);
    const errors = {};
    const { criteria, comments, generalObservations } = normalized;

    if (requireComplete) {
        for (const { key } of EVALUATION_CRITERIA) {
            if (!criteria[key]) {
                errors[`criteria.${key}`] = "workplaceEvaluation.errors.ratingRequired";
            }
        }

        const { month1, month2, month3 } = criteria.supervisionHoursPerWeek;
        if (month1 === "" || month2 === "" || month3 === "") {
            errors.supervisionHoursPerWeek = "workplaceEvaluation.errors.supervisionHoursRequired";
        }

        if (criteria.hourlySalary === "" && criteria.salaryInteresting !== "CANNOT_SAY") {
            errors.hourlySalary = "workplaceEvaluation.errors.hourlySalaryRequired";
        }
    }

    if (hasDisagreement(criteria) && !comments.trim()) {
        errors.comments = "workplaceEvaluation.errors.commentRequiredOnDisagreement";
    }

    if (requireComplete) {
        if (!generalObservations.preferredForStage) {
            errors.preferredForStage = "workplaceEvaluation.errors.preferredStageRequired";
        }

        if (!generalObservations.openToInternCount) {
            errors.openToInternCount = "workplaceEvaluation.errors.internCapacityRequired";
        }

        if (generalObservations.wouldWelcomeSameInternAgain === null) {
            errors.wouldWelcomeSameInternAgain = "workplaceEvaluation.errors.welcomeAgainRequired";
        }

        if (generalObservations.variableShifts === null) {
            errors.variableShifts = "workplaceEvaluation.errors.variableShiftsRequired";
        }
    }

    if (generalObservations.variableShifts === true) {
        const hasValidRange = generalObservations.shiftRanges.some(
            (range) => range.from.trim() && range.to.trim()
        );
        if (!hasValidRange) {
            errors.shiftRanges = "workplaceEvaluation.errors.shiftRangeRequired";
        }
    }

    return errors;
}

/**
 * Normalizes form state into the JSON payload expected by the backend.
 */
export function buildEvaluationPayload(formData) {
    const { criteria, comments, generalObservations } = formData;
    const toNumberOrNull = (val) => (val === "" || val == null ? null : Number(val));

    return {
        criteria: {
            ...criteria,
            supervisionHoursPerWeek: {
                month1: toNumberOrNull(criteria.supervisionHoursPerWeek.month1),
                month2: toNumberOrNull(criteria.supervisionHoursPerWeek.month2),
                month3: toNumberOrNull(criteria.supervisionHoursPerWeek.month3),
            },
            hourlySalary: toNumberOrNull(criteria.hourlySalary),
        },
        comments: comments.trim(),
        generalObservations: {
            preferredForStage: generalObservations.preferredForStage || null,
            openToInternCount: generalObservations.openToInternCount || null,
            wouldWelcomeSameInternAgain: generalObservations.wouldWelcomeSameInternAgain,
            variableShifts: generalObservations.variableShifts,
            shiftRanges:
                generalObservations.variableShifts === true
                    ? generalObservations.shiftRanges.filter(
                        (r) => r.from.trim() && r.to.trim()
                    )
                    : [],
        },
    };
}