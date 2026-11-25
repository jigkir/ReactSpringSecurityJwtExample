/**
 * Workplace evaluations page: teacher workplace evaluations to fill and sign.
 *
 * <WorkplaceEvaluations />  full page (route /evaluations)
 *
 * Access control is handled by route guards in App.jsx,
 * and enforced again by the backend.
 */

import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import WorkplaceEvaluationList from "../WorkplaceEvaluation/WorkplaceEvaluationList.jsx";
import {getAuthClasses} from "../../styles/AppStyles.jsx";
import {useSession} from "../../utils/useSession.js";

const WorkplaceEvaluations = () => {
    const {dark, user} = useOutletContext();
    const {t} = useTranslation();
    const {pageClass} = getAuthClasses(dark);
    const {selectedSession} = useSession();

    return (
        <div className={`${pageClass} items-start`}>
            <div className="w-full max-w-4xl min-w-0 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4 border-slate-700/40">
                    <div className="space-y-1 min-w-0">
                        <h1
                            className={`text-2xl font-bold tracking-tight ${
                                dark ? "text-white" : "text-gray-900"
                            }`}
                        >
                            {t("workplaceEvaluation.title")}
                        </h1>
                        <p
                            className={`text-sm ${
                                dark ? "text-slate-400" : "text-gray-600"
                            }`}
                        >
                            {t("workplaceEvaluation.subtitle")}
                        </p>
                    </div>
                </div>

                <WorkplaceEvaluationList dark={dark} user={user} selectedSession={selectedSession}/>
            </div>
        </div>
    );
};

export default WorkplaceEvaluations;