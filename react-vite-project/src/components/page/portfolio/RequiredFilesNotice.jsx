/**
 * RequiredFilesNotice.jsx — Onboarding banner of the student portfolio.
 * Tells the student which documents are required (CV) and which are optional
 * (cover letters, transcripts).
 *
 * Props
 *   dark  boolean
 */

import {useTranslation} from 'react-i18next';
import Icon from '../../../styles/Icon.jsx';

function RequiredFilesNotice({dark}) {
    const {t} = useTranslation();
    const muted = dark ? "text-slate-300" : "text-gray-700";

    return (
        <section role="status"
                 className={`rounded-xl border-l-4 border-indigo-500 border p-5 space-y-4 shadow-sm ${
                     dark ? "bg-slate-800 border-slate-700 text-white" : "bg-indigo-50 border-indigo-200 text-gray-900"}`}>
            <div className="flex items-start gap-3">
                <Icon name="upload_file" size={28} className="text-indigo-500 shrink-0"/>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold">{t("portfolio.onboarding.title")}</h2>
                    <p className={`text-sm mt-1 ${muted}`}>{t("portfolio.onboarding.intro")}</p>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {/* Mandatory */}
                <div
                    className={`rounded-lg border p-3 ${dark ? "border-red-500/40 bg-red-500/10" : "border-red-200 bg-red-50"}`}>
                    <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-red-300" : "text-red-700"}`}>
                        {t("portfolio.onboarding.requiredLabel")}
                    </p>
                    <p className="font-semibold mt-1">{t("portfolio.onboarding.requiredFile")}</p>
                    <p className={`text-sm mt-1 ${muted}`}>{t("portfolio.onboarding.requiredHint")}</p>
                </div>

                {/* Optional */}
                <div
                    className={`rounded-lg border p-3 ${dark ? "border-slate-600 bg-slate-700/40" : "border-gray-200 bg-white"}`}>
                    <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-slate-300" : "text-gray-600"}`}>
                        {t("portfolio.onboarding.optionalLabel")}
                    </p>
                    <ul className="mt-1 list-disc pl-5 font-semibold">
                        <li>{t("portfolio.types.COVER_LETTER")}</li>
                        <li>{t("portfolio.types.TRANSCRIPT")}</li>
                    </ul>
                    <p className={`text-sm mt-1 ${muted}`}>{t("portfolio.onboarding.optionalHint")}</p>
                </div>
            </div>
        </section>
    );
}

export default RequiredFilesNotice;