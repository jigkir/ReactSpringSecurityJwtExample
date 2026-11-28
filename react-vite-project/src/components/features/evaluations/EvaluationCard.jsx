import {useState} from "react";
import {useTranslation} from "react-i18next";
import {getInternshipCardClasses} from "../../../styles/theme/AppStyles.jsx";
import {
    createInitialEvaluation,
    EVALUATION_CRITERIA,
    validateEvaluation,
} from "../../../utils/evaluations/WorkplaceEvaluation.js";
import EvaluationForm from "./EvaluationForm.jsx";
import SignForm from "../../shared/documents/SignForm.jsx";
import EvaluationActions from "./EvaluationActions.jsx";
import Button from "../../../styles/ui/Button.jsx";
import {Link} from "react-router-dom";
import {ALL, borderStatusOf} from "../../../utils/status/StatusColor.js";
import {evaluationColor} from "../../../utils/roles/EvaluationRole.js";
import {evaluationFilePath} from "../../../routes/AppRoutes.jsx";

export default function EvaluationCard({
                                                    evaluation = {},
                                                    onSave,
                                                    onSign,
                                                    dark = false,
                                                    devMode = false,
                                                    filterColor = ALL,
                                                    role,
                                                }) {
    const {t} = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    const source = evaluation ?? {};
    const normalizedEvaluation = createInitialEvaluation(source.form ?? {});

    const isSigned = Boolean(source.signedAt);
    const isCompleted =
        Object.keys(
            validateEvaluation(normalizedEvaluation, {requireComplete: true})
        ).length === 0;
    const statusKey = isSigned || isCompleted ? "APPROVED" : "PENDING";

    const cardClasses = getInternshipCardClasses(dark, borderStatusOf(filterColor));

    const badgeClasses = getInternshipCardClasses(dark, evaluationColor(source) === "GREEN" ? "APPROVED" : "PENDING");

    const answeredCriteriaCount = EVALUATION_CRITERIA.filter(({key}) =>
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
        ? t("workplaceEvaluation.card.weekLabel", {week: source.week})
        : source.evaluationDate || t("workplaceEvaluation.card.pendingPeriod");

    const handleSave = async (payload) => {
        const result = await onSave?.({
            ...payload,
            id: source.id ?? payload.id,
        });
        if (result?.success) setIsEditing(false);
        return result ?? {success: false};
    };

    const handleSignSubmit = async ({termsAccepted, password}) => {
        if (!onSign) return {success: false};

        return onSign(
            source.id ?? normalizedEvaluation.id,
            {
                ...normalizedEvaluation,
                id: source.id ?? normalizedEvaluation.id,
            },
            {termsAccepted, password}
        );
    };

    if (isEditing && !isSigned) {
        return (
            <div className={cardClasses.card}>
                <EvaluationForm
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
                <SignForm
                    dark={dark}
                    devMode={devMode}
                    onSubmit={handleSignSubmit}
                    onClose={() => setIsSigning(false)}
                    i18nPrefix="workplaceEvaluation"
                    fallbackErrorKey="workplaceEvaluation.sign.errorFailed"
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

                <span className={badgeClasses.statusBadge(statusKey)}>
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
            </div>

            <div className={`${cardClasses.detailsRow} justify-end`}>
                <EvaluationActions
                    dark={dark} role={role} isSigned={isSigned} isCompleted={isCompleted}
                    onEdit={() => { setIsSigning(false); setIsEditing(true); }}
                    onSign={() => { setIsEditing(false); setIsSigning(true); }}
                />
                {isSigned && role?.can.openFile && (<Button
                    as={Link}
                    to={evaluationFilePath(role.filePath, evaluation.id)}
                    state={{studentName: evaluation.studentName}}
                    tone="accent"
                    lockTone
                    dark={dark}
                    icon="download"
                >
                    {t("workplaceEvaluation.file.open")}
                </Button>)}
            </div>
        </article>
    );
}
