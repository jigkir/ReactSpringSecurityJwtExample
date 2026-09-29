/**
 * CvDocuments.jsx — CV list, shared by students and managers.
 *
 * mode="student" (default): list own CVs, share/unshare, delete, choose main CV.
 * mode="manager":           list pending public CVs, preview, approve, refuse.
 *
 * Preview is rendered inline under the row (toggle), several can be open at once.
 *
 * CVDto fields: id, content (Base64), sharingScope (PUBLIC|PRIVATE), fileName,
 *               sizeBytes, uploadedAt, visibility (VISIBLE|HIDDEN),
 *               status (PENDING|APPROVED|REFUSED), priority (MAIN|...)
 *
 * Student endpoints: GET /student/{id}/cvs, PUT .../{cvId}/public|private|hide|main
 *
 * Props
 *   studentId   string    required in student mode
 *   dark        boolean
 *   mode        "student" | "manager"
 *   api         object    optional override
 *   onAddClick  function  optional — shows "Ajouter un CV" (student mode)
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button, {useButtonClasses} from '../../../../styles/Button.jsx';
import CvPreview from './CvPreview.jsx';
import {
    approveCv,
    getPendingCvs,
    getStudentCvs,
    hideCv,
    rejectCv,
    setCvScope,
    setMainCv,
} from '../../../api/Api.jsx';
import {base64ToBlobUrl, formatBytes, formatDate, sortDocs} from './cvUtils.js';
import {getCvDocumentsClasses} from '../../../../styles/appStyles.jsx';

// ─── API bindings (all HTTP lives in Api.jsx) ─────────────────────────────────

const buildStudentApi = (studentId) => ({
    list: () => getStudentCvs(studentId),
    setScope: (cvId, scope) => setCvScope(studentId, cvId, scope),
    hide: (cvId) => hideCv(studentId, cvId),
    makeMain: (cvId) => setMainCv(studentId, cvId),
});

const managerApi = {
    list: getPendingCvs,
    approve: approveCv,
    refuse: rejectCv,
};

const STATUS_LABEL = {
    PENDING: ["cvDocuments.statusPending", "En attente de validation"],
    APPROVED: ["cvDocuments.statusApproved", "Approuvé"],
    REFUSED: ["cvDocuments.statusRefused", "Refusé"],
    REJECTED: ["cvDocuments.statusRefused", "Refusé"],
};

const CvDocuments = ({studentId, dark, mode = "student", api: apiProp, onAddClick}) => {
    const {t} = useTranslation();
    const isManager = mode === "manager";

    // Stable reference avoids a reload loop; hook is always called (no conditional hooks).
    const defaultApi = useMemo(
        () => (isManager ? managerApi : buildStudentApi(studentId)),
        [isManager, studentId],
    );
    const api = apiProp ?? defaultApi;

    const {btn, btnTone} = useButtonClasses(dark);
    const th = getCvDocumentsClasses(dark);

    const [docs, setDocs] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [confirmId, setConfirmId] = useState(null); // student: delete / manager: refuse
    const [actionError, setActionError] = useState("");
    const [openPreviewIds, setOpenPreviewIds] = useState([]);

    // ── Data loading ──────────────────────────────────────────────────────────

    const load = useCallback(async () => {
        setLoadFailed(false);
        try {
            const all = await api.list();
            setDocs(sortDocs(isManager ? all : all.filter((d) => d.visibility === "VISIBLE")));
        } catch {
            setLoadFailed(true);
        }
    }, [api, isManager]);

    useEffect(() => {
        if (isManager || studentId) load();
    }, [load, isManager, studentId]);

    // ── Student mutations ─────────────────────────────────────────────────────

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
            setConfirmId(null);
        }
    };

    const toggleScope = (doc) =>
        runAction(doc.id, () => api.setScope(doc.id, doc.sharingScope === "PUBLIC" ? "private" : "public"));

    const hideDoc = (doc) => runAction(doc.id, () => api.hide(doc.id));

    const makeMain = (doc) => runAction(doc.id, () => api.makeMain(doc.id));

    // ── Manager decision ──────────────────────────────────────────────────────
    // The backend returns the updated CVDto. We patch it into the list instead of
    // reloading, so the row stays visible with its new status until the page is
    // refreshed (the /pending endpoint no longer returns decided CVs).

    const decide = async (doc, action) => {
        setBusyId(doc.id);
        setActionError("");
        try {
            const updated = await api[action](doc.id);
            setDocs((prev) => prev.map((d) => (d.id === doc.id ? {...d, ...updated} : d)));
        } catch (e) {
            if (e.status === 409) {
                setActionError(t("cvDocuments.alreadyReviewed", "Ce CV a déjà été traité par un gestionnaire."));
                await load();
            } else {
                setActionError(t("cvDocuments.errorAction"));
            }
        } finally {
            setBusyId(null);
            setConfirmId(null);
        }
    };

    // ── Preview (inline toggle) ───────────────────────────────────────────────

    const togglePreview = (cvId) => {
        setOpenPreviewIds((prev) =>
            prev.includes(cvId)
                ? prev.filter((id) => id !== cvId)
                : [...prev, cvId]
        );
    };

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
    }, [docs, t]);

    // ── Body ──────────────────────────────────────────────────────────────────

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
        body = (
            <p className={th.muted}>
                {isManager
                    ? t("cvDocuments.emptyManager", "Aucun CV en attente de validation.")
                    : t("cvDocuments.empty")}
            </p>
        );
    } else {
        body = (
            <ul className={th.list}>
                {docs.map((doc) => {
                    const busy = busyId === doc.id;
                    const confirming = confirmId === doc.id;
                    const isPublic = doc.sharingScope === "PUBLIC";
                    const isPreviewOpen = openPreviewIds.includes(doc.id);
                    const isMain = doc.priority === "MAIN";
                    const status = doc.status ?? "PENDING";
                    const isPending = status === "PENDING";
                    const [statusKey, statusFallback] = STATUS_LABEL[status] ?? STATUS_LABEL.PENDING;
                    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewBtn");
                    const mainLabel = isMain
                        ? t("cvDocuments.mainCv", "CV principal")
                        : t("cvDocuments.makeMainBtn", "Choisir comme CV principal");

                    return (
                        <li key={doc.id} aria-busy={busy}>
                            <div className={th.row}>

                                {/* Identity */}
                                <div className="min-w-0 md:flex-1">
                                    <p className={th.name}>{doc.fileName}</p>
                                    <p className={th.meta}>
                                        {t("cvDocuments.docType")} · {formatBytes(doc.sizeBytes)} · {t("cvDocuments.uploadedOn")} {formatDate(doc.uploadedAt)}
                                    </p>
                                </div>

                                {/* Pills: validation status (both modes) + sharing scope (student only) */}
                                <div className="flex flex-wrap items-center gap-2 md:w-72 md:shrink-0">
                                    <span className={`${th.pillBase} ${th.statusPill(status)}`}>
                                        {t(statusKey, statusFallback)}
                                    </span>
                                    {!isManager && (
                                        <span className={`${th.pillBase} ${isPublic ? th.pillPublic : th.pillPrivate}`}>
                                            {isPublic ? t("cvDocuments.scopePublic") : t("cvDocuments.scopePrivate")}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
                                    {confirming ? (
                                        <>
                                            <span className={th.confirmText}>
                                                {isManager
                                                    ? t("cvDocuments.refuseAsk", "Refuser ce CV ? L'étudiant pourra téléverser une version corrigée.")
                                                    : t("cvDocuments.hideAsk")}
                                            </span>
                                            <Button tone="danger" dark={dark} disabled={busy} autoFocus
                                                    onClick={() => isManager ? decide(doc, "refuse") : hideDoc(doc)}>
                                                {t("cvDocuments.confirmBtn")}
                                            </Button>
                                            <Button tone="neutral" dark={dark} disabled={busy}
                                                    onClick={() => setConfirmId(null)}>
                                                {t("cvDocuments.cancelBtn")}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button tone="accent" dark={dark} onClick={() => togglePreview(doc.id)}
                                                    disabled={busy || !doc.content}
                                                    aria-expanded={isPreviewOpen}
                                                    aria-label={`${viewLabel} : ${doc.fileName}`}>
                                                {viewLabel}
                                            </Button>

                                            {isManager ? (
                                                isPending && (
                                                    <>
                                                        <Button tone="neutral" dark={dark} disabled={busy}
                                                                onClick={() => decide(doc, "approve")}
                                                                aria-label={`${t("cvDocuments.approveBtn", "Approuver")} : ${doc.fileName}`}>
                                                            {t("cvDocuments.approveBtn", "Approuver")}
                                                        </Button>
                                                        <Button tone="danger" dark={dark} disabled={busy}
                                                                onClick={() => setConfirmId(doc.id)}
                                                                aria-label={`${t("cvDocuments.refuseBtn", "Refuser")} : ${doc.fileName}`}>
                                                            {t("cvDocuments.refuseBtn", "Refuser")}
                                                        </Button>
                                                    </>
                                                )
                                            ) : (
                                                <>
                                                    <Button tone="neutral" dark={dark} onClick={() => toggleScope(doc)}
                                                            disabled={busy}
                                                            aria-label={`${isPublic ? t("cvDocuments.makePrivate") : t("cvDocuments.makePublic")} : ${doc.fileName}`}>
                                                        {isPublic ? t("cvDocuments.makePrivate") : t("cvDocuments.makePublic")}
                                                    </Button>
                                                    <Button tone="danger" dark={dark} onClick={() => setConfirmId(doc.id)}
                                                            disabled={busy}
                                                            aria-label={`${t("cvDocuments.hideBtn")} : ${doc.fileName}`}>
                                                        {t("cvDocuments.hideBtn")}
                                                    </Button>
                                                    <Button tone="neutral" dark={dark} onClick={() => makeMain(doc)}
                                                            disabled={busy || isMain}
                                                            aria-label={`${mainLabel} : ${doc.fileName}`}>
                                                        {mainLabel}
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {isPreviewOpen && (
                                <div className="py-4">
                                    <CvPreview doc={doc} dark={dark} getUrl={getUrl}/>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <section className={th.card} aria-label={t("cvDocuments.title")}>
            <div className={th.header}>
                <h2 className={th.title}>
                    {isManager ? t("cvDocuments.titleManager", "CVs à valider") : t("cvDocuments.title")}
                </h2>
                {!isManager && onAddClick && (
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
    );
};

export default CvDocuments;
