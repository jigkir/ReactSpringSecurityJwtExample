/**
 * WorkplaceEvaluationList.jsx — Workplace evaluations for the connected user:
 * list, fill/edit progress, sign when complete.
 *
 * Used by WorkplaceEvaluations.jsx.
 * <WorkplaceEvaluationList />          full page: evaluations for selectedSession,
 *                                      unsigned/incomplete first, then newest first.
 * <WorkplaceEvaluationList preview />  Home page block: unsigned evaluations not yet signed,
 *                                      no header. Leaves this list once signed.
 *
 * Props: dark, user, preview
 */

import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../styles/Button.jsx";
import { getPostInternshipClasses } from "../../styles/AppStyles.jsx";
import PreviewState from "../home/PreviewState.jsx";
import { useDevMode } from "../dev/DevMode.jsx";
import { useLoadedList } from "../../utils/useLoadedList.js";
import { useSession } from "../../utils/useSession.js";
import {
    createInitialEvaluation,
    validateEvaluation,
} from "../../utils/WorkplaceEvaluation.js";
import { fetchWorkplaceEvaluations } from "../api/Api.jsx";
import WorkplaceEvaluationCard from "./WorkplaceEvaluationCard.jsx";

const byNewest = (a, b) =>
    new Date(b.updatedAt ?? b.createdAt ?? 0) -
    new Date(a.updatedAt ?? a.createdAt ?? 0);

const isEvaluationComplete = (item) =>
    Object.keys(
        validateEvaluation(createInitialEvaluation(item), { requireComplete: true })
    ).length === 0;

// Unsigned first, then newest first
const sortEvaluations = (list) =>
    [...list].sort(
        (a, b) => Number(Boolean(a.signedAt)) - Number(Boolean(b.signedAt)) || byNewest(a, b)
    );

const WorkplaceEvaluationList = ({ dark, user, preview = false }) => {
    const { t } = useTranslation();
    const { selectedSession } = useSession();
    const { devMode } = useDevMode();
    const s = getPostInternshipClasses(dark);

    const loadEvaluations = useCallback(async () => {
        if (preview) return fetchWorkplaceEvaluations({ pendingOnly: true });
        return selectedSession ? fetchWorkplaceEvaluations(selectedSession.id) : null;
    }, [preview, selectedSession]);

    const { items, setItems, failed, reload } = useLoadedList(loadEvaluations);

    const shown = useMemo(() => {
        if (!items) return null;
        const list = preview ? items.filter((item) => !item.signedAt) : items;
        return sortEvaluations(list);
    }, [items, preview]);

    const handleSave = async (id, payload) => {
        // Swap with your PUT/PATCH API call when ready, e.g. saveWorkplaceEvaluation(id, payload)
        setItems((previous) =>
            (previous ?? []).map((item) =>
                item.id === id
                    ? {
                        ...item,
                        ...payload,
                        id: item.id ?? id,
                        updatedAt: new Date().toISOString(),
                    }
                    : item
            )
        );
        return { success: true };
    };

    const handleSign = async (id, evaluation, credentials) => {
        if (!isEvaluationComplete(evaluation)) return { success: false };

        // Swap with your sign endpoint when ready, e.g. signWorkplaceEvaluation(id, credentials)
        const signedAt = new Date().toISOString();
        setItems((previous) =>
            (previous ?? []).map((item) =>
                item.id === id
                    ? {
                        ...item,
                        ...evaluation,
                        id: item.id ?? id,
                        signedAt,
                        signedBy: user?.name || user?.email || "Teacher",
                    }
                    : item
            )
        );

        return { success: true };
    };

    const cards = (shown ?? []).map((evaluation) => (
        <WorkplaceEvaluationCard
            key={evaluation.id}
            evaluation={evaluation}
            dark={dark}
            devMode={devMode}
            onSave={(payload) => handleSave(evaluation.id, payload)}
            onSign={(evalId, currentEval, credentials) =>
                handleSign(evalId, currentEval, credentials)
            }
        />
    ));

    if (preview) {
        return (
            <PreviewState
                dark={dark}
                error={failed && items === null}
                loading={shown === null}
                empty={shown?.length === 0}
                emptyText="workplaceEvaluation.previewEmpty"
            >
                {cards}
            </PreviewState>
        );
    }

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
    } else if (shown.length === 0) {
        body = <p className={s.emptyText}>{t("workplaceEvaluation.empty")}</p>;
    } else {
        body = cards;
    }

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("workplaceEvaluation.title")}</h1>
                    <p className={s.subtitle}>{t("workplaceEvaluation.subtitle")}</p>
                </div>
            </div>

            <div className={s.listSection}>
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
};

export default WorkplaceEvaluationList;