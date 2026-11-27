/**
 * WorkplaceEvaluationList.jsx — Workplace evaluations for the connected user:
 * list, fill/edit progress, sign when complete.
 *
 * Used by WorkplaceEvaluations.jsx (route /evaluations): evaluations of the session chosen
 * in the navbar, unsigned/incomplete first, then newest first.
 *
 * Props: dark, user
 */

import {useCallback, useMemo} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../styles/Button.jsx";
import {getPostInternshipClasses} from "../../styles/AppStyles.jsx";
import {useDevMode} from "../dev/DevMode.jsx";
import {useLoadedList} from "../../utils/useLoadedList.js";
import {StatusColorSelect, useColorFilter} from "../../utils/Sort.jsx";
import {ALL, COLOR, matchesColor} from "../../utils/StatusColor.js";
import {
    createInitialEvaluation,
    validateEvaluation,
} from "../../utils/WorkplaceEvaluation.js";
import {
    fetchWorkplaceEvaluations,
    fetchWorkplaceEvaluationsManager,
    saveWorkplaceEvaluations,
    signWorkplaceEvaluation
} from "../api/Api.jsx";
import WorkplaceEvaluationCard from "./WorkplaceEvaluationCard.jsx";
import {devSignWorkplaceEvaluation} from "../api/DevApi.jsx";

// Evaluations have no red: signed (GREEN) or not signed yet (YELLOW)
const EVALUATION_COLORS = [ALL, COLOR.YELLOW, COLOR.GREEN];
const evaluationColor = (item) => (item.signedAt ? COLOR.GREEN : COLOR.YELLOW);

const byNewest = (a, b) =>
    new Date(b.updatedAt ?? b.createdAt ?? 0) -
    new Date(a.updatedAt ?? a.createdAt ?? 0);

const isEvaluationComplete = (item) =>
    Object.keys(
        validateEvaluation(createInitialEvaluation(item), {requireComplete: true})
    ).length === 0;

// Unsigned first, then newest first
const sortEvaluations = (list) =>
    [...list].sort(
        (a, b) => Number(Boolean(a.signedAt)) - Number(Boolean(b.signedAt)) || byNewest(a, b)
    );

const WorkplaceEvaluationList = ({dark, user, selectedSession}) => {
    const {t} = useTranslation();
    const {devMode} = useDevMode();
    const s = getPostInternshipClasses(dark);

    // Status color lives in the URL (?status=), so the Home buttons open the page already filtered
    const [status, setStatus] = useColorFilter("status", EVALUATION_COLORS);

    const loadEvaluations = useCallback(async () => {
        if (!selectedSession?.id) return null;
        console.log(user.role)
        return user.role == "TEACHER" ?
            fetchWorkplaceEvaluations(selectedSession.id) :
            fetchWorkplaceEvaluationsManager(selectedSession.id);
    }, [selectedSession?.id]);

    const {items, setItems, failed, reload} = useLoadedList(loadEvaluations);

    // Filter by status color, then unsigned first / newest first
    const shown = useMemo(
        () => (items
            ? sortEvaluations(items.filter((item) => matchesColor(evaluationColor(item), status)))
            : null),
        [items, status]);

    const handleSave = async (id, payload) => {
        try {
            const answer = await saveWorkplaceEvaluations(id, payload);
            await reload();
            return {success: true};
        } catch (err) {
            return {
                success: false,
                message: err?.message ?? t("workplaceEvaluation.errors.submitFailed"),
            };
        }
    };

    const handleSign = async (id, evaluation, sign) => {
        if (!isEvaluationComplete(evaluation)) return {success: false};

        try {
            devMode
                ? await devSignWorkplaceEvaluation(id, user?.email)
                : await signWorkplaceEvaluation(id, sign);
            await reload();
            return {success: true};
        } catch (error) {
            return {
                success: false,
                message: {key: "workplaceEvaluation.errors.signing"},
            };
        }
    };

    const cards = (shown ?? []).map((evaluation) => (
        <WorkplaceEvaluationCard
            key={evaluation.id}
            evaluation={evaluation}
            dark={dark}
            devMode={devMode}
            filterColor={status}
            onSave={(payload) => handleSave(evaluation.id, payload)}
            onSign={handleSign}
        />
    ));

    let body;
    if (failed && items === null) {
        body = (
            <div className={s.errorText} role="alert">
                <p>{t("workplaceEvaluation.loadError")}</p>
                <Button
                    tone="neutral"
                    dark={dark}
                    onClick={() => void reload()}
                    className="mt-3"
                >
                    {t("workplaceEvaluation.retryBtn")}
                </Button>
            </div>
        );
    } else if (shown === null) {
        body = (
            <p className={s.loadingText} aria-busy="true">
                {t("workplaceEvaluation.loading")}
            </p>
        );
    } else if (items.length === 0) {
        body = <p className={s.emptyText}>{t("workplaceEvaluation.empty")}</p>;
    } else if (shown.length === 0) {
        body = <p className={s.emptyText}>{t("workplaceEvaluation.noMatch")}</p>;
    } else {
        body = cards;
    }

    return (
        <div className="flex w-full min-w-0 flex-col gap-4">
            {items && items.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <StatusColorSelect dark={dark} value={status} onChange={setStatus}
                                       colors={EVALUATION_COLORS} page="teacherEvaluations"
                                       ariaLabel={t("internshipFilters.statusAria")}/>
                </div>
            )}
            <div className="space-y-4">{body}</div>
        </div>
    );
};

export default WorkplaceEvaluationList;