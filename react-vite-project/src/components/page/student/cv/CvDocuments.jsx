/**
 * CvDocuments.jsx — "Documents déposés" list.
 *
 * CVDto fields: id, content (Base64), sharingScope (PUBLIC|PRIVATE),
 *               fileName, sizeBytes, uploadedAt, visible
 *
 * Endpoints (StudentController):
 *   GET /api/student/{studentId}/cvs                    → List<CVDto> (VISIBLE only)
 *   PUT /api/student/{studentId}/cvs/{cvId}/public      → CVSharingScope.PUBLIC
 *   PUT /api/student/{studentId}/cvs/{cvId}/private     → CVSharingScope.PRIVATE
 *   PUT /api/student/{studentId}/cvs/{cvId}/hide        → CvVisibility.HIDDEN
 *
 * Props
 *   studentId   string    required
 *   dark        boolean
 *   api         object    optional override — { list, setScope, hide }
 *   onAddClick  function  optional — shows "Ajouter un CV" in the header
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import CvButton, {useButtonClasses} from './CvButton.jsx';
import CvPreview from './CvPreview.jsx';
import fetcher from '../../../../utils/fetcher.js';
import {base64ToBlobUrl, formatBytes, formatDate, sortDocs} from './cvUtils.js';
import {getCvDocumentsClasses} from '../../../../styles/appStyles.jsx';

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiRequest(path, options) {
    const res = await fetcher(path, options);
    if (!res.ok) {
        const e = new Error(`HTTP ${res.status}`);
        e.status = res.status;
        throw e;
    }
    return res;
}

function buildApi(studentId) {
    return {
        list: () => apiRequest(`student/${studentId}/cvs`, {method: "GET"}).then((r) => r.json()),
        setScope: (cvId, scope) => apiRequest(`student/${studentId}/cvs/${cvId}/${scope}`, {method: "PUT"}),
        hide: (cvId) => apiRequest(`student/${studentId}/cvs/${cvId}/hide`, {method: "PUT"}),
    };
}

// ─── Component ───────────────────────────────────────────────────────────────

const CvDocuments = ({studentId, dark, api: apiProp, onAddClick}) => {
    const {t} = useTranslation();

    // Stable api reference — prevents the `load` callback from re-creating
    // on every render and triggering an infinite GET /cvs loop.
    const api = apiProp ?? useMemo(() => buildApi(studentId), [studentId]); // eslint-disable-line react-hooks/rules-of-hooks
    const {btn, btnTone} = useButtonClasses(dark);
    const th = getCvDocumentsClasses(dark);

    const [docs, setDocs] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [confirmHideId, setConfirmHideId] = useState(null);
    const [actionError, setActionError] = useState("");
    const [previewDoc, setPreviewDoc] = useState(null);

    // ── Data loading ──────────────────────────────────────────────────────────

    const load = useCallback(async () => {
        setLoadFailed(false);
        try {
            setDocs(sortDocs(await api.list()));
        } catch {
            setLoadFailed(true);
        }
    }, [api]);

    useEffect(() => {
        if (studentId) load();
    }, [load, studentId]);

    // ── Mutations ─────────────────────────────────────────────────────────────

    // Run one mutation then reload so the list always mirrors the server.
    const runAction = async (id, fn) => {
        setBusyId(id);
        setActionError("");
        try {
            await fn();
            await load();
        } catch {
            setActionError(t("cvDocuments.errorAction"));
        } finally {
            setBusyId(null);
            setConfirmHideId(null);
        }
    };

    const toggleScope = (doc) =>
        runAction(doc.id, () => api.setScope(doc.id, doc.sharingScope === "PUBLIC" ? "private" : "public"));

    const hideDoc = (doc) => runAction(doc.id, () => api.hide(doc.id));

    // ── Preview ───────────────────────────────────────────────────────────────

    /**
     * CvPreview calls getUrl(cvId) when it mounts.
     * We look up the already-loaded doc and convert its Base64 content to a
     * blob URL. No extra network request needed — the list endpoint already
     * returned the full PDF bytes.
     */
    const getUrl = useCallback(async (cvId) => {
        const doc = docs?.find((d) => d.id === cvId);
        if (!doc?.content) throw new Error(t("cvDocuments.previewError"));
        return base64ToBlobUrl(doc.content);
    }, [docs]);

    let body;

    if (loadFailed) {
        body = (
            <div className={th.muted} role="alert">
                <p>{t("cvDocuments.loadError")}</p>
                <button onClick={load} className={`${btn} ${btnTone.neutral} mt-3`}>{t("cvDocuments.retryBtn")}</button>
            </div>
        );
    } else if (docs === null) {
        body = (
            <div className="px-6 py-4 flex flex-col gap-6 animate-pulse" aria-busy="true">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className={`h-4 w-1/3 rounded ${th.skel}`}/>
                        <div className={`h-3 w-1/2 rounded ${th.skel}`}/>
                    </div>
                ))}
            </div>
        );
    } else if (docs.length === 0) {
        body = <p className={th.muted}>{t("cvDocuments.empty")}</p>;
    } else {
        body = (
            <ul className={th.list}>
                {docs.map((doc) => {
                    const busy = busyId === doc.id;
                    const confirming = confirmHideId === doc.id;
                    const isPublic = doc.sharingScope === "PUBLIC";

                    return (
                        <li key={doc.id} className={th.row} aria-busy={busy}>

                            {/* Identity */}
                            <div className="min-w-0 md:flex-1">
                                <p className={th.name}>{doc.fileName}</p>
                                <p className={th.meta}>
                                    {t("cvDocuments.docType")} · {formatBytes(doc.sizeBytes)} · {t("cvDocuments.uploadedOn")} {formatDate(doc.uploadedAt)}
                                </p>
                            </div>

                            {/* Sharing-scope pill */}
                            <div className="flex items-center md:w-56 md:shrink-0">
                                <span className={`${th.pillBase} ${isPublic ? th.pillPublic : th.pillPrivate}`}>
                                    {isPublic ? t("cvDocuments.scopePublic") : t("cvDocuments.scopePrivate")}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
                                {confirming ? (
                                    <>
                                        <span className={th.confirmText}>{t("cvDocuments.hideAsk")}</span>
                                        <CvButton tone="danger" dark={dark} onClick={() => hideDoc(doc)} disabled={busy}
                                                  autoFocus>{t("cvDocuments.confirmBtn")}</CvButton>
                                        <CvButton tone="neutral" dark={dark} onClick={() => setConfirmHideId(null)}
                                                  disabled={busy}>{t("cvDocuments.cancelBtn")}</CvButton>
                                    </>
                                ) : (
                                    <>
                                        <CvButton tone="accent" dark={dark} onClick={() => setPreviewDoc(doc)}
                                                  disabled={busy || !doc.content}
                                                  aria-label={`${t("cvDocuments.viewBtn")} : ${doc.fileName}`}>{t("cvDocuments.viewBtn")}</CvButton>
                                        <CvButton tone="neutral" dark={dark} onClick={() => toggleScope(doc)}
                                                  disabled={busy}
                                                  aria-label={`${isPublic ? t("cvDocuments.makePrivate") : t("cvDocuments.makePublic")} : ${doc.fileName}`}>{isPublic ? t("cvDocuments.makePrivate") : t("cvDocuments.makePublic")}</CvButton>
                                        <CvButton tone="danger" dark={dark} onClick={() => setConfirmHideId(doc.id)}
                                                  disabled={busy}
                                                  aria-label={`${t("cvDocuments.hideBtn")} : ${doc.fileName}`}>{t("cvDocuments.hideBtn")}</CvButton>
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <section className={th.card} aria-label={t("cvDocuments.title")}>
                <div className={th.header}>
                    <h2 className={th.title}>{t("cvDocuments.title")}</h2>
                    {onAddClick && (
                        <button onClick={onAddClick} className={th.addBtn}>{t("cvDocuments.addBtn")}</button>
                    )}
                </div>

                {actionError && (
                    <div className="px-6 pt-4">
                        <div className={th.error} role="alert" aria-live="assertive">{actionError}</div>
                    </div>
                )}

                {body}
            </section>

            {/* PDF preview modal — rendered outside the card so it overlays the full page */}
            {previewDoc && (
                <CvPreview doc={previewDoc} dark={dark} getUrl={getUrl} onClose={() => setPreviewDoc(null)}/>
            )}
        </>
    );
};

export default CvDocuments;
