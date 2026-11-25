/**
 * WorkplaceEvaluation.js — Constants, initial form state, normalization,
 * and validation helpers for the teacher's workplace evaluation form
 * (Évaluation du milieu de stage).
 */
export const CONTRACT_ROLES = {
    MANAGER: {basePath: "/manager/evaluations"},
   TEACHER: {basePath: "/teacher/evaluations"}
};

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
    { key: "supervisionSufficient", extra: "supervisionHoursPerWeek" },
];

export const getEvaluationRole = (user) => {
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    return CONTRACT_ROLES[role] ?? CONTRACT_ROLES.MANAGER;
}

export const createEmptyShiftRange = () => ({ from: "", to: "" });

const toScreamingSnakeCase = (str) =>
    str.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();

const toCamelCase = (str) =>
    str.toLowerCase().replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());

const emptyToNull = (val) => {
    if (val == null) return null;
    const str = String(val).trim();
    if (str === "") return null;
    const num = Number(str);
    return Number.isNaN(num) ? null : num;
};

const emptyToString = (val) => (val == null ? "" : val);

/**
 * Normalizes a backend evaluation response (which uses enum keys like
 * `TASKS_MATCH_AGREEMENT` in `ratings` and top-level fields) into the
 * camelCase form state shape expected by `createInitialEvaluation`.
 */
export const normalizeFetchedEvaluation = (backendData = {}) => {
    if (!backendData || typeof backendData !== "object") {
        return {};
    }

    const rawRatings = backendData.ratings ?? {};
    const criteriaFromRatings = {};

    for (const [key, value] of Object.entries(rawRatings)) {
        if (value != null) {
            criteriaFromRatings[toCamelCase(key)] = value;
        }
    }

    const rawHours =
        backendData.supervisionHoursPerWeek ??
        backendData.criteria?.supervisionHoursPerWeek ??
        {};

    const rawSalary =
        backendData.hourlySalary !== undefined
            ? backendData.hourlySalary
            : backendData.criteria?.hourlySalary;

    const existingCriteria = backendData.criteria ?? {};
    const cleanedExistingCriteria = Object.fromEntries(
        Object.entries(existingCriteria).map(([k, v]) => [k, emptyToString(v)])
    );

    const rawShiftRanges =
        backendData.generalObservations?.shiftRanges ?? backendData.shiftRanges;

    const normalizedShiftRanges = Array.isArray(rawShiftRanges) && rawShiftRanges.length
        ? rawShiftRanges.map((r) => ({
            from: emptyToString(r?.from),
            to: emptyToString(r?.to),
        }))
        : undefined;

    return {
        comments: emptyToString(backendData.comments),
        criteria: {
            ...criteriaFromRatings,
            ...cleanedExistingCriteria,
            hourlySalary: emptyToString(rawSalary),
            supervisionHoursPerWeek: {
                month1: emptyToString(rawHours.month1),
                month2: emptyToString(rawHours.month2),
                month3: emptyToString(rawHours.month3),
            },
        },
        generalObservations: {
            ...(backendData.generalObservations ?? {}),
            preferredForStage: emptyToString(
                backendData.generalObservations?.preferredForStage ??
                backendData.preferredForStage
            ),
            openToInternCount: emptyToString(
                backendData.generalObservations?.openToInternCount ??
                backendData.openToInternCount
            ),
            wouldWelcomeSameInternAgain:
                backendData.generalObservations?.wouldWelcomeSameInternAgain ??
                backendData.wouldWelcomeSameInternAgain ??
                null,
            variableShifts:
                backendData.generalObservations?.variableShifts ??
                backendData.variableShifts ??
                null,
            ...(normalizedShiftRanges ? { shiftRanges: normalizedShiftRanges } : {}),
        },
    };
};

export const createInitialEvaluation = (existing = {}) => {
    const normalizedInput =
        existing?.ratings || existing?.supervisionHoursPerWeek || existing?.hourlySalary !== undefined
            ? normalizeFetchedEvaluation(existing)
            : existing;

    const exCriteria = normalizedInput.criteria ?? {};
    const exHours = exCriteria.supervisionHoursPerWeek ?? {};
    const exObs = normalizedInput.generalObservations ?? {};

    const shiftRanges =
        Array.isArray(exObs.shiftRanges) && exObs.shiftRanges.length
            ? exObs.shiftRanges.map((r) => ({
                from: emptyToString(r?.from),
                to: emptyToString(r?.to),
            }))
            : [createEmptyShiftRange()];

    return {
        criteria: {
            tasksMatchAgreement: emptyToString(exCriteria.tasksMatchAgreement),
            onboardingMeasures: emptyToString(exCriteria.onboardingMeasures),
            supervisionSufficient: emptyToString(exCriteria.supervisionSufficient),
            supervisionHoursPerWeek: {
                month1: emptyToString(exHours.month1),
                month2: emptyToString(exHours.month2),
                month3: emptyToString(exHours.month3),
            },
            healthAndSafetyCompliant: emptyToString(exCriteria.healthAndSafetyCompliant),
            workClimatePleasant: emptyToString(exCriteria.workClimatePleasant),
            publicTransitAccessible: emptyToString(exCriteria.publicTransitAccessible),
            salaryInteresting: emptyToString(exCriteria.salaryInteresting),
            hourlySalary: emptyToString(exCriteria.hourlySalary),
            supervisorCommunicationSmooth: emptyToString(
                exCriteria.supervisorCommunicationSmooth
            ),
            equipmentAdequate: emptyToString(exCriteria.equipmentAdequate),
            workloadAcceptable: emptyToString(exCriteria.workloadAcceptable),
        },
        comments: emptyToString(normalizedInput.comments),
        generalObservations: {
            preferredForStage: emptyToString(exObs.preferredForStage),
            openToInternCount: emptyToString(exObs.openToInternCount),
            wouldWelcomeSameInternAgain: exObs.wouldWelcomeSameInternAgain ?? null,
            variableShifts: exObs.variableShifts ?? null,
            shiftRanges,
        },
    };
};

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
        if (
            String(month1).trim() === "" ||
            String(month2).trim() === "" ||
            String(month3).trim() === ""
        ) {
            errors.supervisionHoursPerWeek =
                "workplaceEvaluation.errors.supervisionHoursRequired";
        }

        if (
            String(criteria.hourlySalary).trim() === "" &&
            criteria.salaryInteresting !== "CANNOT_SAY"
        ) {
            errors.hourlySalary = "workplaceEvaluation.errors.hourlySalaryRequired";
        }
    }

    if (requireComplete && hasDisagreement(criteria) && !comments.trim()) {
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
            errors.wouldWelcomeSameInternAgain =
                "workplaceEvaluation.errors.welcomeAgainRequired";
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
    const normalized = createInitialEvaluation(formData);
    const { criteria, comments, generalObservations } = normalized;

    const ratings = {};
    for (const { key } of EVALUATION_CRITERIA) {
        const value = criteria[key];
        if (value !== "" && value != null) {
            ratings[toScreamingSnakeCase(key)] = value;
        }
    }

    return {
        ratings,
        supervisionHoursPerWeek: {
            month1: emptyToNull(criteria.supervisionHoursPerWeek.month1),
            month2: emptyToNull(criteria.supervisionHoursPerWeek.month2),
            month3: emptyToNull(criteria.supervisionHoursPerWeek.month3),
        },
        hourlySalary: emptyToNull(criteria.hourlySalary),
        comments: (comments ?? "").trim(),
        generalObservations: {
            preferredForStage: generalObservations.preferredForStage || null,
            openToInternCount: generalObservations.openToInternCount || null,
            wouldWelcomeSameInternAgain: generalObservations.wouldWelcomeSameInternAgain,
            variableShifts: generalObservations.variableShifts,
            shiftRanges:
                generalObservations.variableShifts === true
                    ? (generalObservations.shiftRanges ?? [])
                        .filter((r) => r.from?.trim() && r.to?.trim())
                        .map((r) => ({
                            from: r.from.trim(),
                            to: r.to.trim(),
                        }))
                    : [],
        },
    };
}
