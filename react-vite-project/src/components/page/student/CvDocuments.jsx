/**
 * CvDocuments.jsx — "Documents déposés" list: every CV the student has uploaded.
 *
 * Per row:
 *   - file name (click → previews the PDF via CvPreview) + "CV actuel" badge
 *   - type · size · upload date
 *   - status pills: visibility, and "used for an application"
 *   - actions: make visible/private, set/unset main CV, delete (two-step confirm)
 *
 * Rules enforced in the UI (the backend must enforce them too):
 *   - a CV used for an application cannot be deleted
 *   - only one CV can be the main one (the server clears the others)
 *
 * Props
 *   studentId   string    required
 *   dark        boolean   theme from useOutletContext()
 *   api         object    optional — { list, getUrl, setVisible, setPrimary, remove }
 *                         defaults to the built-in localApi when omitted
 *   onAddClick  function  optional — shows an "Ajouter un CV" button in the header
 */

import {useState, useEffect, useCallback} from 'react';
import {getAuthClasses} from '../auth/styles/authStyles.jsx';
import CvButton, {useButtonClasses} from './CvButton.jsx';
import CvPreview from './CvPreview.jsx';
import fetcher from '../../../utils/fetcher.js';

const TEXTS = {
    title:         "Documents déposés",
    addBtn:        "Ajouter un CV",
    docType:       "Curriculum vitae",
    uploadedOn:    "déposé le",
    primaryBadge:  "CV actuel",
    private:       "Visible par vous seulement",
    shared:        "Visible aux intervenants",
    usedForApp:    "Utilisé pour une candidature",
    makeVisible:   "Rendre visible",
    makePrivate:   "Rendre privé",
    setPrimary:    "Choisir principal",
    unsetPrimary:  "Retirer principal",
    deleteBtn:     "Supprimer",
    deleteAsk:     "Supprimer ce CV ?",
    confirmBtn:    "Confirmer",
    cancelBtn:     "Annuler",
    deleteBlocked: "Ce CV est lié à une candidature et ne peut pas être supprimé.",
    empty:         "Aucun document déposé pour le moment.",
    loadError:     "Impossible de charger vos documents.",
    retryBtn:      "Réessayer",
    errorAction:   "L'action a échoué. Veuillez réessayer.",
    errorInUse:    "Ce CV est lié à une candidature et ne peut pas être supprimé."
};

const JSON_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json;charset=UTF-8' };

async function request(path, options) {
    const res = await fetcher(path, options);
    if (!res.ok) { const e = new Error(`HTTP ${res.status}`); e.status = res.status; throw e; }
    return res;
}

// ─── Default API (used when no api prop is passed) ────────────────────────────

const localApi = {
    // GET /api/student/{studentId}/cvs → List<CVDto>
    async list(studentId) {
        return (await request(`student/${studentId}/cvs`, {method: 'GET'})).json();
    },

    // NOT YET IMPLEMENTED — endpoint GET /api/student/cv/{cvId}/file does not exist in BE
    // async getUrl(cvId) { ... },

    // NOT YET IMPLEMENTED — BE has PUT hide/public/private but no unified PATCH visibility
    // Use individual endpoints once wired:
    //   PUT /api/student/{studentId}/cvs/{cvId}/hide
    //   PUT /api/student/{studentId}/cvs/{cvId}/public
    //   PUT /api/student/{studentId}/cvs/{cvId}/private
    // async setVisible(studentId, cvId, visible) { ... },

    // NOT YET IMPLEMENTED — no primary/main CV concept in BE yet
    // async setPrimary(cvId, primary) { ... },

    // NOT YET IMPLEMENTED — no DELETE /api/student/cv/{cvId} in BE yet
    // async remove(cvId) { ... },
};

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// fr-CA renders dates as YYYY-MM-DD (e.g. 2026-09-18)
const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-CA');

// Newest first
const sortDocs = (list) =>
    [...list].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

// ─── Component ───────────────────────────────────────────────────────────────

const CvDocuments = ({studentId, dark, api: apiProp, onAddClick}) => {
    // Fall back to the built-in localApi when no api prop is supplied (normal case).
    const api = apiProp ?? localApi;

    const {serverErrorClass} = getAuthClasses(dark);
    const {btn, btnTone}     = useButtonClasses(dark);

    const [docs,            setDocs]            = useState(null);
    const [loadFailed,      setLoadFailed]       = useState(false);
    const [busyId,          setBusyId]           = useState(null);
    const [confirmDeleteId, setConfirmDeleteId]  = useState(null);
    const [actionError,     setActionError]      = useState('');
    const [previewDoc,      setPreviewDoc]       = useState(null);

    const load = useCallback(async () => {
        setLoadFailed(false);
        try {
            setDocs(sortDocs(await api.list(studentId)));
        } catch {
            setLoadFailed(true);
        }
    }, [api, studentId]);

    useEffect(() => {
        if (!studentId) return; // user payload not loaded yet
        load();
    }, [load, studentId]);

    // Run one mutation, then reload so the list always mirrors the server.
    const runAction = async (id, fn, fallbackMsg) => {
        setBusyId(id);
        setActionError('');
        try {
            await fn();
            await load();
        } catch (err) {
            setActionError(err?.status === 409 ? TEXTS.errorInUse : fallbackMsg);
        } finally {
            setBusyId(null);
            setConfirmDeleteId(null);
        }
    };

    // NOT YET IMPLEMENTED — visibility toggle requires BE endpoint (see api comments above)
    const toggleVisible  = (_doc) => setActionError('Fonctionnalité non encore disponible (visibilité).');
    // NOT YET IMPLEMENTED — primary/main CV requires BE endpoint
    const togglePrimary  = (_doc) => setActionError('Fonctionnalité non encore disponible (CV principal).');
    // NOT YET IMPLEMENTED — delete requires BE endpoint
    const confirmDelete  = (_doc) => { setConfirmDeleteId(null); setActionError('Fonctionnalité non encore disponible (suppression).'); };

    // ── Theme tokens ─────────────────────────────────────────────────────────

    const pill     = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap';
    const pillTone = {
        primary: dark ? 'bg-indigo-500/20 text-indigo-200' : 'bg-indigo-100 text-indigo-700',
        private: dark ? 'bg-slate-700 text-slate-200'      : 'bg-gray-100 text-gray-700',
        shared:  dark ? 'bg-amber-500/20 text-amber-200'   : 'bg-amber-100 text-amber-800',
        used:    dark ? 'bg-red-500/20 text-red-200'       : 'bg-red-100 text-red-700',
    };

    const t = {
        card:   `w-full rounded-xl border shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`,
        header: `flex items-center justify-between gap-4 px-6 py-4 border-b ${dark ? 'border-slate-700' : 'border-gray-200'}`,
        title:  `text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`,
        list:   `divide-y ${dark ? 'divide-slate-700' : 'divide-gray-200'}`,
        row:    `flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center transition-colors duration-150 ${dark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50'}`,
        name:   `max-w-full truncate text-left text-sm font-semibold rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${dark ? 'text-indigo-300' : 'text-indigo-700'}`,
        meta:   `mt-1 text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`,
        muted:  `px-6 py-8 text-center text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`,
        skel:   dark ? 'bg-slate-700' : 'bg-gray-200',
    };

    // ── Body states ──────────────────────────────────────────────────────────

    let body;

    if (loadFailed) {
        body = (
            <div className={t.muted} role="alert">
                <p>{TEXTS.loadError}</p>
                <button onClick={load} className={`${btn} ${btnTone.neutral} mt-3`}>
                    {TEXTS.retryBtn}
                </button>
            </div>
        );
    } else if (docs === null) {
        body = (
            <div className="px-6 py-4 flex flex-col gap-6 animate-pulse" aria-busy="true">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className={`h-4 w-1/3 rounded ${t.skel}`}/>
                        <div className={`h-3 w-1/2 rounded ${t.skel}`}/>
                    </div>
                ))}
            </div>
        );
    } else if (docs.length === 0) {
        body = <p className={t.muted}>{TEXTS.empty}</p>;
    } else {
        body = (
            <ul className={t.list}>
                {docs.map((doc) => {
                    const busy       = busyId === doc.id;
                    const confirming = confirmDeleteId === doc.id;

                    return (
                        <li key={doc.id} className={t.row} aria-busy={busy}>
                            {/* Identity */}
                            <div className="min-w-0 md:flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Preview disabled — GET /api/student/cv/{cvId}/file not yet implemented */}
                                    <span
                                        className={t.name}
                                        title={doc.fileName}
                                    >
                                        {doc.fileName}
                                    </span>
                                    {doc.primary && (
                                        <span className={`${pill} ${pillTone.primary}`}>{TEXTS.primaryBadge}</span>
                                    )}
                                </div>
                                <p className={t.meta}>
                                    {TEXTS.docType} · {formatBytes(doc.sizeBytes)} · {TEXTS.uploadedOn} {formatDate(doc.uploadedAt)}
                                </p>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col items-start gap-2 md:w-60 md:shrink-0">
                                <span className={`${pill} ${doc.visible ? pillTone.shared : pillTone.private}`}>
                                    {doc.visible ? TEXTS.shared : TEXTS.private}
                                </span>
                                {doc.usedForApplication && (
                                    <span className={`${pill} ${pillTone.used}`}>{TEXTS.usedForApp}</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
                                {confirming ? (
                                    <>
                                        <span className={`text-sm ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
                                            {TEXTS.deleteAsk}
                                        </span>
                                        <CvButton
                                            tone="danger" dark={dark}
                                            onClick={() => confirmDelete(doc)}
                                            disabled={busy}
                                            autoFocus
                                        >
                                            {TEXTS.confirmBtn}
                                        </CvButton>
                                        <CvButton
                                            tone="neutral" dark={dark}
                                            onClick={() => setConfirmDeleteId(null)}
                                            disabled={busy}
                                        >
                                            {TEXTS.cancelBtn}
                                        </CvButton>
                                    </>
                                ) : (
                                    <>
                                        <CvButton
                                            tone="neutral" dark={dark}
                                            onClick={() => toggleVisible(doc)}
                                            disabled={busy}
                                            aria-label={`${doc.visible ? TEXTS.makePrivate : TEXTS.makeVisible} : ${doc.fileName}`}
                                        >
                                            {doc.visible ? TEXTS.makePrivate : TEXTS.makeVisible}
                                        </CvButton>
                                        <CvButton
                                            tone="accent" dark={dark}
                                            onClick={() => togglePrimary(doc)}
                                            disabled={busy}
                                            aria-label={`${doc.primary ? TEXTS.unsetPrimary : TEXTS.setPrimary} : ${doc.fileName}`}
                                        >
                                            {doc.primary ? TEXTS.unsetPrimary : TEXTS.setPrimary}
                                        </CvButton>
                                        <CvButton
                                            tone="danger" dark={dark}
                                            onClick={() => setConfirmDeleteId(doc.id)}
                                            disabled={busy || doc.usedForApplication}
                                            title={doc.usedForApplication ? TEXTS.deleteBlocked : undefined}
                                            aria-label={`${TEXTS.deleteBtn} : ${doc.fileName}`}
                                        >
                                            {TEXTS.deleteBtn}
                                        </CvButton>
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <section className={t.card} aria-label={TEXTS.title}>
            <div className={t.header}>
                <h2 className={t.title}>{TEXTS.title}</h2>
                {onAddClick && (
                    <button
                        onClick={onAddClick}
                        className="text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                    >
                        {TEXTS.addBtn}
                    </button>
                )}
            </div>

            {actionError && (
                <div className="px-6 pt-4">
                    <div className={serverErrorClass} role="alert" aria-live="assertive">
                        {actionError}
                    </div>
                </div>
            )}

            {body}

            {/* CvPreview disabled — GET /api/student/cv/{cvId}/file not yet implemented */}
        </section>
    );
};

export default CvDocuments;
