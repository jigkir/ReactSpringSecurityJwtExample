/**
 * DocumentList.jsx — List of the student's cover letters or transcripts (no review status).
 * CVs keep using CvDocuments (they have an approval flow).
 */

import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import CvPreview from '../cv/CvPreview.jsx';
import {getDocumentFile, getDocuments, hideDocument} from '../../api/Api.jsx';
import {base64ToBlobUrl, formatBytes, formatDate} from '../cv/cvUtils.js';
import {getCvDocumentsClasses} from '../../../styles/AppStyles.jsx';
import {DOC_TYPES} from '../../../utils/DocumentTypes.js';
import {usePolling} from '../../../utils/usePolling.js';

export default function DocumentList({type, dark, onAddClick}) {
    const {t, i18n} = useTranslation();
    const th = getCvDocumentsClasses(dark);
    const [docs, setDocs] = useState(null);
    const [failed, setFailed] = useState(false);
    const [openIds, setOpenIds] = useState([]);
    const [confirmId, setConfirmId] = useState(null);

    const load = useCallback(async () => {
        setFailed(false);
        try {
            const list = await getDocuments(type);
            setDocs([...list].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        } catch {
            setFailed(true);
        }
    }, [type]);

    useEffect(() => {
        void load();
    }, [load]);

    usePolling(load);

    const getUrl = useCallback(async (id) => {
        const file = await getDocumentFile(type, id);
        if (!file?.content) throw new Error("missing content");
        return base64ToBlobUrl(file.content);
    }, [type]);

    const remove = async (id) => {
        try {
            await hideDocument(type, id);
        } finally {
            setConfirmId(null);
            await load();
        }
    };

    const toggle = (id) =>
        setOpenIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));

    let body;
    if (failed) {
        body = (
            <div className={th.muted} role="alert">
                <p>{t("cvDocuments.loadError")}</p>
                <Button tone="neutral" dark={dark} onClick={() => void load()} className="mt-3">
                    {t("cvDocuments.retryBtn")}
                </Button>
            </div>
        );
    } else if (docs === null) {
        body = <p className={th.muted} aria-busy="true">{t("commonFields.loading")}</p>;
    } else if (docs.length === 0) {
        body = <p className={th.muted}>{t("portfolio.empty")}</p>;
    } else {
        body = (
            <ul className={th.list}>
                {docs.map((d) => (
                    <li key={d.id}>
                        <div className={th.row}>
                            <div className="min-w-0 flex-1">
                                <p className={th.name}>{d.fileName}</p>
                                <p className={th.meta}>
                                    {formatBytes(d.sizeBytes, i18n.resolvedLanguage ?? i18n.language)}
                                    {" · "}{t("cvDocuments.uploadedOn")} {formatDate(d.uploadedAt)}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button tone="accent" lockTone dark={dark} onClick={() => toggle(d.id)}
                                        icon={openIds.includes(d.id) ? "close" : "visibility"}
                                        aria-expanded={openIds.includes(d.id)}>
                                    {openIds.includes(d.id) ? t("cvPreview.closeBtn") : t("cvDocuments.viewBtn")}
                                </Button>
                                {confirmId === d.id ? (
                                    <>
                                        <Button tone="danger" dark={dark} icon="check_circle"
                                                onClick={() => remove(d.id)}>
                                            {t("cvDocuments.confirmBtn")}
                                        </Button>
                                        <Button tone="neutral" dark={dark} icon="close"
                                                onClick={() => setConfirmId(null)}>
                                            {t("cvDocuments.cancelBtn")}
                                        </Button>
                                    </>
                                ) : (
                                    <Button tone="danger" dark={dark} icon="delete"
                                            onClick={() => setConfirmId(d.id)}>
                                        {t("cvDocuments.hideBtn")}
                                    </Button>
                                )}
                            </div>
                        </div>
                        {openIds.includes(d.id) && (
                            <div className="px-6 pb-4">
                                <CvPreview doc={d} dark={dark} getUrl={getUrl}/>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <section className={th.card} aria-label={t(DOC_TYPES[type].labelKey)}>
            <div className={th.header}>
                <h2 className={th.title}>{t(`portfolio.titles.${type}`)}</h2>
                <Button tone="primary" dark={dark} onClick={onAddClick} className="ml-auto">
                    {t("portfolio.add")}
                </Button>
            </div>
            {body}
        </section>
    );
}