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
import Button from "../../styles/Button.jsx";
import {Link} from "react-router-dom";

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
    const normalizedEvaluation = createInitialEvaluation(source.form);

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

                {/*<span className={cardClasses.detailBadge}>*/}
                {/*    {isSigned*/}
                {/*        ? t("workplaceEvaluation.card.signedOn", {*/}
                {/*            date: source.signedAt,*/}
                {/*        })*/}
                {/*        : t("workplaceEvaluation.card.notSignedYet")}*/}
                {/*</span>*/}
            </div>

            <div className={`${cardClasses.detailsRow} justify-end`}>
                {!isSigned && (
                    <Button
                        tone="warning"
                        icon="edit"
                        dark={dark}
                        onClick={() => {
                            setIsSigning(false);
                            setIsEditing(true);
                        }}
                    >
                        {isCompleted
                            ? t("workplaceEvaluation.card.reviewOrEdit")
                            : t("workplaceEvaluation.card.fillEvaluation")}
                    </Button>
                )}

                {isCompleted && !isSigned && onSign && (
                    <Button
                        dark={dark}
                        lockTone
                        icon="edit"
                        tone="success"
                        onClick={() => {
                            setIsEditing(false);
                            setIsSigning(true);
                        }}
                    >
                        {t("workplaceEvaluation.card.sign")}
                    </Button>
                )}
                {isSigned && (<Button
                    as={Link}
                    to={`${evaluation.id}`}
                     state={{studentName: evaluation.studentName}}
                    tone="accent"
                    lockTone
                    dark={dark}
                    icon="download"
                >
                    {t("managerContracts.download.open")}
                </Button>)}
            </div>
        </article>
    );
}