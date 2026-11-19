import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getInternshipCardClasses } from "../../styles/AppStyles.jsx";
import {
    createInitialEvaluation,
    EVALUATION_CRITERIA,
    validateEvaluation,
} from "../../utils/WorkplaceEvaluation.js";
import WorkplaceEvaluationForm from "./WorkplaceEvaluationForm";
import SignEvaluationForm from "./SignEvaluationForm";

export default function WorkplaceEvaluationCard({
                                                    evaluation = {},
                                                    onSave,
                                                    onSign,
                                                    dark = false,
                                                    devMode = false,
                                                }) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    const source = evaluation ?? {};
    const normalizedEvaluation = createInitialEvaluation(source);

    const isSigned = Boolean(source.signedAt);
    const isCompleted =
        Object.keys(
            validateEvaluation(normalizedEvaluation, { requireComplete: true })
        ).length === 0;
    const statusKey = isSigned || isCompleted ? "APPROVED" : "PENDING";
    const cardClasses = getInternshipCardClasses(dark, statusKey);

    const answeredCriteriaCount = EVALUATION_CRITERIA.filter(({ key }) =>
        Boolean(normalizedEvaluation.criteria?.[key])
    ).length;

    const workplaceLabel =
        source.workplaceName ||
        source.companyName ||
        t("workplaceEvaluation.card.defaultTitle");

    const internLabel =
        source.internName ||
        source.studentName ||
        t("workplaceEvaluation.card.unassignedIntern");

    const supervisorLabel =
        source.supervisorName ||
        t("workplaceEvaluation.card.unassignedSupervisor");

    const periodLabel = source.week
        ? t("workplaceEvaluation.card.weekLabel", { week: source.week })
        : source.evaluationDate || t("workplaceEvaluation.card.pendingPeriod");

    const handleSave = async (payload) => {
        await onSave?.({
            ...payload,
            id: source.id ?? payload.id,
        });
        setIsEditing(false);
    };

    const handleSignSubmit = async ({ termsAccepted, password }) => {
        if (!onSign) return { success: false };

        return onSign(
            source.id ?? normalizedEvaluation.id,
            {
                ...normalizedEvaluation,
                id: source.id ?? normalizedEvaluation.id,
            },
            { termsAccepted, password }
        );
    };

    if (isEditing && !isSigned) {
        return (
            <div className={cardClasses.card}>
                <WorkplaceEvaluationForm
                    initialData={normalizedEvaluation}
                    dark={dark}
                    onSubmit={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    if (isSigning && !isSigned && isCompleted) {
        return (
            <div className={cardClasses.card}>
                <SignEvaluationForm
                    dark={dark}
                    devMode={devMode}
                    onSubmit={handleSignSubmit}
                    onClose={() => setIsSigning(false)}
                />
            </div>
        );
    }

    return (
        <article className={cardClasses.card}>
            <div className={cardClasses.topRow}>
                <div className="min-w-0 flex-1">
                    <h3 className={cardClasses.title}>{workplaceLabel}</h3>
                    <p className={cardClasses.description}>
                        {internLabel} • {periodLabel}
                    </p>
                    <p className={cardClasses.description}>
                        {t("workplaceEvaluation.card.supervisorLabel", {
                            supervisor: supervisorLabel,
                        })}
                    </p>
                </div>

                <span className={cardClasses.statusBadge(statusKey)}>
                    {isSigned
                        ? t("workplaceEvaluation.status.signed")
                        : isCompleted
                            ? t("workplaceEvaluation.status.completed")
                            : t("workplaceEvaluation.status.inProgress")}
                </span>
            </div>

            <p className={cardClasses.description}>
                {normalizedEvaluation.comments ||
                    t("workplaceEvaluation.card.noCommentsYet")}
            </p>

            <div className={cardClasses.detailsRow}>
                <span className={cardClasses.detailBadge}>
                    {t("workplaceEvaluation.card.criteriaProgress", {
                        answered: answeredCriteriaCount,
                        total: EVALUATION_CRITERIA.length,
                    })}
                </span>

                <span className={cardClasses.detailBadge}>
                    {normalizedEvaluation.criteria?.hourlySalary != null &&
                    normalizedEvaluation.criteria?.hourlySalary !== ""
                        ? t("workplaceEvaluation.card.hourlySalary", {
                            rate: normalizedEvaluation.criteria.hourlySalary,
                        })
                        : t("workplaceEvaluation.card.hourlySalaryMissing")}
                </span>

                <span className={cardClasses.detailBadge}>
                    {normalizedEvaluation.generalObservations?.variableShifts === true
                        ? t("workplaceEvaluation.card.variableShiftsCount", {
                            count:
                                normalizedEvaluation.generalObservations.shiftRanges
                                    ?.length ?? 0,
                        })
                        : t("workplaceEvaluation.card.variableShiftsMissing")}
                </span>

                <span className={cardClasses.detailBadge}>
                    {isSigned
                        ? t("workplaceEvaluation.card.signedOn", {
                            date: source.signedAt,
                        })
                        : t("workplaceEvaluation.card.notSignedYet")}
                </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-700/30">
                {!isSigned && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsSigning(false);
                            setIsEditing(true);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            dark
                                ? "bg-slate-700/70 text-slate-200 border-slate-600 hover:bg-slate-700"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        {isCompleted
                            ? t("workplaceEvaluation.card.reviewOrEdit")
                            : t("workplaceEvaluation.card.fillEvaluation")}
                    </button>
                )}

                {isCompleted && !isSigned && onSign && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            setIsSigning(true);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            dark
                                ? "bg-green-900/40 text-green-300 border-green-700 hover:bg-green-900/60"
                                : "bg-green-600 text-white border-green-600 hover:bg-green-700"
                        }`}
                    >
                        {t("workplaceEvaluation.card.sign")}
                    </button>
                )}
            </div>
        </article>
    );
}