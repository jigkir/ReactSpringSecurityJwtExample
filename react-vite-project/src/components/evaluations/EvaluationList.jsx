/**
 * EvaluationList.jsx — Workplace evaluations for the connected user:
 * list, fill/edit progress, sign when complete.
 *
 * Used by the teacher and manager evaluation wrappers: evaluations of the session chosen
 * in the navbar, unsigned/incomplete first, then newest first.
 *
 * Props: dark, user
 */

import {useCallback, useMemo} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../styles/Button.jsx";
import {getPostInternshipClasses} from "../../styles/AppStyles.jsx";
import {getAuthClasses} from "../../styles/AppStyles.jsx";
import {useDevMode} from "../dev/DevMode.jsx";
import {useLoadedList} from "../../utils/useLoadedList.js";
import {StatusColorSelect, useColorFilter} from "../../utils/Sort.jsx";
import {matchesColor} from "../../utils/StatusColor.js";
import EvaluationCard from "./EvaluationCard.jsx";
import {useSession} from "../../utils/useSession.js";
import {useNotifications} from "../notification/NotificationsProvider.jsx";
import {getEvaluationRole, EVALUATION_COLORS, evaluationColor, isEvaluationComplete, sortEvaluations} from "../../utils/EvaluationRole.js";

const EvaluationList = ({dark, user}) => {
    const {t} = useTranslation();
    const {devMode} = useDevMode();
    const s = getPostInternshipClasses(dark);
    const {pageClass} = getAuthClasses(dark);
    const role = getEvaluationRole(user);
    const {selectedSession} = useSession();
    const {refresh: refreshNotifications} = useNotifications();

    // Status color lives in the URL (?status=), so the Home buttons open the page already filtered
    const [status, setStatus] = useColorFilter("status", EVALUATION_COLORS);

    const loadEvaluations = useCallback(async () => {
        if (!selectedSession?.id) return null;
        return role.fetchList(selectedSession.id);
    }, [selectedSession?.id, role]);

    const {items, setItems, failed, reload} = useLoadedList(loadEvaluations);

    // Filter by status color, then unsigned first / newest first
    const shown = useMemo(
        () => (items
            ? sortEvaluations(items.filter((item) => matchesColor(evaluationColor(item), status)))
            : null),
        [items, status]);

    const handleSave = async (id, payload) => {
        try {
            await role.save(id, payload);
            await reload();
            await refreshNotifications();
            return {success: true};
        } catch (err) {
            if (err?.status === 409 || err?.status === 404) await reload();
            return {
                success: false,
                message: err?.i18n ?? {key: "workplaceEvaluation.errors.submitFailed"},
            };
        }
    };

    const handleSign = async (id, evaluation, sign) => {
        if (!isEvaluationComplete(evaluation)) return {success: false};

        try {
            devMode
                ? await role.devSign(id, user?.email)
                : await role.sign(id, sign);
            await reload();
            await refreshNotifications();
            return {success: true};
        } catch (error) {
            if (error?.status === 409 || error?.status === 404) await reload();
            return {
                success: false,
                message: {key: "workplaceEvaluation.errors.signing"},
            };
        }
    };

    const cards = (shown ?? []).map((evaluation) => (
        <EvaluationCard
            key={evaluation.id}
            evaluation={evaluation}
            dark={dark}
            devMode={devMode}
            filterColor={status}
            onSave={(payload) => handleSave(evaluation.id, payload)}
            onSign={handleSign}
            role={role}
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
        <div className={`${pageClass} items-start w-full`}>
            <div className="w-full max-w-4xl min-w-0 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4 border-slate-700/40">
                    <div className="space-y-1 min-w-0">
                        <h1 className={`text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
                            {t("workplaceEvaluation.title")}
                        </h1>
                        <p className={`text-sm ${dark ? "text-slate-400" : "text-gray-600"}`}>{t(role.subtitleKey)}</p>
                    </div>
                </div>
                <div className="flex w-full min-w-0 flex-col gap-4">
                    {items && items.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusColorSelect dark={dark} value={status} onChange={setStatus}
                                               colors={EVALUATION_COLORS} page={role.statusPage}
                                               ariaLabel={t("internshipFilters.statusAria")}/>
                        </div>
                    )}
                    <div className="space-y-4">{body}</div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationList;