import {useCallback, useState} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/ui/Button.jsx";
import {getAuthClasses, getPostInternshipClasses} from "../../../styles/theme/AppStyles.jsx";
import {blobUrlFromFile, buildFileName, saveFile} from "../../../utils/documents/Documents.js";
import PdfPreview from "./PdfPreview.jsx";

const LANGUAGES = ["FR", "EN"];

export default function PdfFilePage({
    dark, id, backTo, titleKey, subtitleKey, backKey, docType, studentName: locationStudentName, fetchFile,
}) {
    const {t, i18n} = useTranslation();
    const {id: routeId} = useParams();
    const {state} = useLocation();
    const {pageClass} = getAuthClasses(dark);
    const s = getPostInternshipClasses(dark);
    const documentId = id ?? Number(routeId);
    const studentName = locationStudentName ?? state?.studentName;
    const [language, setLanguage] = useState(i18n.resolvedLanguage?.startsWith("fr") ? "FR" : "EN");
    const [downloading, setDownloading] = useState(null);
    const [downloadFailed, setDownloadFailed] = useState(false);

    const getUrl = useCallback(
        async (documentId) => blobUrlFromFile(await fetchFile(documentId, language)),
        [language, fetchFile],
    );

    const download = async (languages, mode) => {
        setDownloading(mode);
        setDownloadFailed(false);
        try {
            for (const lang of languages) {
                const file = await fetchFile(documentId, lang);
                saveFile(file, buildFileName({language: lang, docType, studentName, originalName: file.fileName}));
            }
        } catch {
            setDownloadFailed(true);
        } finally {
            setDownloading(null);
        }
    };

    const busy = downloading !== null;
    const segment = (active) => `px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? "bg-indigo-600 text-white" : dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-gray-700 hover:bg-gray-100"}`;

    return (
        <div className={`${pageClass} items-start`}>
            <div className="w-full max-w-4xl min-w-0 space-y-4">
                <div className={s.headerSection}>
                    <div><h1 className={s.title}>{t(titleKey)}</h1><p className={s.subtitle}>{t(subtitleKey)}</p></div>
                    <Button as={Link} to={backTo} tone="neutral" dark={dark} icon="arrow_back">{t(backKey)}</Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div role="group" aria-label={t("managerContracts.file.languageGroup")}
                         className={`inline-flex overflow-hidden rounded-lg border ${dark ? "border-slate-600" : "border-gray-300"}`}>
                        {LANGUAGES.map((lang) => (
                            <button key={lang} type="button" aria-pressed={language === lang}
                                    onClick={() => setLanguage(lang)} className={segment(language === lang)}>
                                {t(`managerContracts.file.language.${lang.toLowerCase()}`)}
                            </button>
                        ))}
                    </div>
                    <div role="group" aria-label={t("managerContracts.download.group")} className="flex flex-wrap items-center justify-end gap-2">
                        <Button tone="accent" lockTone dark={dark} icon="download" disabled={busy}
                                onClick={() => download([language], language)}>
                            {downloading === language ? t("managerContracts.file.downloading") : t("managerContracts.file.downloadCurrent", {language: t(`managerContracts.file.language.${language.toLowerCase()}`)})}
                        </Button>
                        <Button tone="accent" lockTone dark={dark} icon="download" disabled={busy}
                                onClick={() => download(LANGUAGES, "BOTH")}>
                            {downloading === "BOTH" ? t("managerContracts.file.downloading") : t("managerContracts.file.downloadBoth")}
                        </Button>
                    </div>
                </div>
                {downloadFailed && <p className={`text-sm ${dark ? "text-red-300" : "text-red-600"}`} role="alert">{t("managerContracts.download.failed")}</p>}
                <PdfPreview doc={{id: documentId, fileName: t(titleKey)}} dark={dark} getUrl={getUrl}/>
            </div>
        </div>
    );
}
