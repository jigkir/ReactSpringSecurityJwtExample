/**
 * CvDocuments.jsx — CV list, shared by students and managers.
 *
 * mode="student" (default): list own CVs, share/unshare, delete, choose main CV.
 * mode="manager":           list all public CVs, filter/sort (status, discipline, search, date, student),
 *                           preview, approve, refuse (with comment).
 *
 * Filtering / sorting logic lives in utils/Sort.jsx (useCvFilters, sortCvsNewest).
 *
 * Preview is rendered inline under the row (toggle), several can be open at once.
 *
 * Row layout (md and up): 3 columns
 *   [ identity (name + meta) ] [ status pills, stacked ] [ actions ]
 * Student actions are a 2x2 grid:
 *   Preview            | Share / Make private
 *   Set as main CV     | Delete   (Delete is always last)
 * Below md everything stacks vertically.
 *
 * List fields
 *   student : id, sharingScope, fileName, sizeBytes, uploadedAt, priority,
 *             visibility, status, rejectionComment
 *   manager : id, fileName, uploadedAt, status, rejectionComment,
 *             student {id, firstName, lastName, email, studentId, discipline}
 * The PDF itself (Base64 `content`) is fetched on demand:
 *   GET student/{id}/cvs/{cvId}   or   GET manager/cvs/{cvId}/file
 *
 * `actionError` stores a translation KEY (not text) and is translated at render,
 * so it follows the language switch live. `getUrl` does not depend on `t`,
 * so an open PDF preview is not reloaded when the language changes.
 *
 * Props
 *   studentId   string    required in student mode
 *   dark        boolean
 *   mode        "student" | "manager"
 *   api         object    optional override
 *   onAddClick  function  optional — shows the "add CV" button (student mode)
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button, {useButtonClasses} from '../../../styles/Button.jsx';
import Icon from '../../../styles/Icon.jsx';
import CvPreview from './CvPreview.jsx';
import AutoResizeTextarea from '../../../utils/AutoResizeTextarea.jsx';
import {CV_SORT_OPTIONS, sortCvsNewest, useCvFilters} from '../../../utils/Sort.jsx';
import {
    approveCv,
    getManagerCvFile,
    getPublicCvs,
    getStudentCvFile,
    getStudentCvs,
    hideCv,
    rejectCv,
    setCvScope,
    setMainCv,
} from '../../api/Api.jsx';
import {base64ToBlobUrl, formatBytes, formatDate} from './cvUtils.js';
import {getCvDocumentsClasses} from '../../../styles/AppStyles.jsx';

// ─── API bindings (all HTTP lives in Api.jsx) ─────────────────────────────────

const buildStudentApi = (studentId) => ({
    list: () => getStudentCvs(studentId),
    file: (cvId) => getStudentCvFile(studentId, cvId),
    setScope: (cvId, scope) => setCvScope(studentId, cvId, scope),
    hide: (cvId) => hideCv(studentId, cvId),
    makeMain: (cvId) => setMainCv(studentId, cvId),
});

const managerApi = {
    list: getPublicCvs,
    file: getManagerCvFile,
    approve: approveCv,
    refuse: rejectCv,
};

const STATUS_KEY = {
    PENDING: "cvDocuments.statusPending",
    APPROVED: "cvDocuments.statusApproved",
    REFUSED: "cvDocuments.statusRefused",
    REJECTED: "cvDocuments.statusRefused",
};

// Material Symbols name shown inside each status pill
const STATUS_ICON = {
    PENDING: "schedule",
    APPROVED: "check_circle",
    REFUSED: "close",
    REJECTED: "close",
};

const CvDocuments = ({studentId, dark, mode = "student", api: apiProp, onAddClick}) => {
    const {t, i18n} = useTranslation();
    const lang = i18n.resolvedLanguage ?? i18n.language;
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
    const [refuseComment, setRefuseComment] = useState("");
    const [actionError, setActionError] = useState("");
    const [openPreviewIds, setOpenPreviewIds] = useState([]);

    const filters = useCvFilters(docs);

    const textareaClass = `w-full md:max-w-sm rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    const selectClass = `rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    // Row = 3 columns on md+: identity (flexible) | pills (auto) | actions (auto).
    // Defined here (instead of th.row) so the grid and the old flex classes can't conflict.
    const rowClass = `grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-[minmax(12rem,1fr)_auto_auto] md:items-center md:gap-6 transition-colors duration-150 ${
        dark ? "hover:bg-slate-700/40" : "hover:bg-gray-50"
    }`;

    // Full-width, centered text inside the 2x2 grid cells.
    const cellBtn = "w-full justify-center text-center";

    // ── Data loading ──────────────────────────────────────────────────────────

    const load = useCallback(async () => {
        setLoadFailed(false);
        try {
            const all = await api.list();
            // Manager: sorting/filtering is done by useCvFilters.
            setDocs(isManager ? all : sortCvsNewest(all.filter((d) => d.visibility === "VISIBLE")));
        } catch {
            setLoadFailed(true);
        }
    }, [api, isManager]);

    useEffect(() => {
        if (isManager || studentId) void load();
    }, [load, isManager, studentId]);

    // Student: list as loaded. Manager: filtered + sorted list from the hook.
    const visibleDocs = docs === null ? null : isManager ? filters.visible : docs;

    // ── Student mutations ─────────────────────────────────────────────────────

    const runAction = async (id, fn) => {
        setBusyId(id);
        setActionError("");
        try {
            await fn();
            await load();
        } catch {
            setActionError("cvDocuments.errorAction");
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
    // The backend returns the updated DTO. We patch it into the list instead of
    // reloading, so the row stays visible with its new status (and is re-filtered
    // by the status filter automatically).

    const decide = async (doc, action) => {
        setBusyId(doc.id);
        setActionError("");
        try {
            const updated = await api[action](doc.id, action === "refuse" ? refuseComment : undefined);
            setDocs((prev) => prev.map((d) => (d.id === doc.id ? {...d, ...updated} : d)));
        } catch (e) {
            if (e.status === 409) {
                setActionError("cvDocuments.alreadyReviewed");
                await load();
            } else {
                setActionError("cvDocuments.errorAction");
            }
        } finally {
            setBusyId(null);
            setConfirmId(null);
            setRefuseComment("");
        }
    };

    // Opens the reject form. When editing an existing rejection, the old comment is pre-filled.
    const startRefuse = (doc) => {
        setConfirmId(doc.id);
        setRefuseComment(doc.rejectionComment ?? "");
    };

    const cancelConfirm = () => {
        setConfirmId(null);
        setRefuseComment("");
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
     * The list endpoints no longer carry the PDF, so we fetch it on demand
     * and convert the Base64 content to a blob URL.
     */
    const getUrl = useCallback(async (cvId) => {
        const file = await api.file(cvId);
        if (!file?.content) throw new Error("missing content");
        return base64ToBlobUrl(file.content);
    }, [api]);

    // ── Manager toolbar ───────────────────────────────────────────────────────

    const toolbar = isManager && docs !== null && !loadFailed && (
        <div
            className={`flex flex-wrap items-center gap-2 px-6 py-3 border-b ${dark ? "border-slate-700" : "border-gray-200"}`}>
            {/* Search: native (blue) clear button hidden, replaced by a red Google "close" icon */}
            <div className="relative w-full md:w-64">
                <input
                    type="search"
                    value={filters.search}
                    onChange={(e) => filters.setSearch(e.target.value)}
                    placeholder={t("cvDocuments.searchPlaceholder")}
                    aria-label={t("cvDocuments.searchAria")}
                    className={`${selectClass} w-full pr-8 [&::-webkit-search-cancel-button]:appearance-none`}
                />
                {filters.search && (
                    <button
                        type="button"
                        onClick={() => filters.setSearch("")}
                        aria-label={t("cvDocuments.clearSearchAria")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex text-red-500 hover:text-red-600"
                    >
                        <Icon name="close" size={18}/>
                    </button>
                )}
            </div>
            <select value={filters.status} onChange={(e) => filters.setStatus(e.target.value)}
                    className={selectClass} aria-label={t("cvDocuments.statusAria")}>
                <option value="ALL">{t("cvDocuments.allStatuses")}</option>
                <option value="PENDING">{t("cvDocuments.filterPending")}</option>
                <option value="APPROVED">{t("cvDocuments.statusApproved")}</option>
                <option value="REJECTED">{t("cvDocuments.statusRefused")}</option>
            </select>
            <select value={filters.discipline} onChange={(e) => filters.setDiscipline(e.target.value)}
                    className={selectClass} aria-label={t("cvDocuments.disciplineAria")}>
                <option value="ALL">{t("cvDocuments.allDisciplines")}</option>
                {filters.disciplines.map((d) => (
                    <option key={d} value={d}>
                        {t(`disciplines.${d.toLowerCase()}`, {defaultValue: d})}
                    </option>
                ))}
            </select>
            <select value={filters.sort} onChange={(e) => filters.setSort(e.target.value)}
                    className={selectClass} aria-label={t("cvDocuments.sortAria")}>
                {CV_SORT_OPTIONS.map(([value, key]) => (
                    <option key={value} value={value}>{t(key)}</option>
                ))}
            </select>

            <button
                className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1 ml-auto ${
                    dark ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => void load()}
                title="Refresh"
            >
                <Icon name="refresh" size={20} />
            </button>
        </div>
    );

    // ── Body ──────────────────────────────────────────────────────────────────

    let body;

    if (loadFailed) {
        body = (
            <div className={th.muted} role="alert">
                <p>{t("cvDocuments.loadError")}</p>
                <button onClick={() => void load()} className={`${btn} ${btnTone.neutral} mt-3`}>
                    {t("cvDocuments.retryBtn")}
                </button>
            </div>
        );
    } else if (visibleDocs === null) {
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
    } else if (visibleDocs.length === 0) {
        body = (
            <p className={th.muted}>
                {isManager ? t("cvDocuments.emptyManager") : t("cvDocuments.empty")}
            </p>
        );
    } else {
        body = (
            <ul className={th.list}>
                {visibleDocs.map((doc) => {
                    const busy = busyId === doc.id;
                    const confirming = confirmId === doc.id;
                    const isPublic = doc.sharingScope === "PUBLIC";
                    const isPreviewOpen = openPreviewIds.includes(doc.id);
                    const isMain = doc.priority === "MAIN";
                    const status = doc.status ?? "PENDING";
                    const isApproved = status === "APPROVED";
                    const isRejected = status === "REJECTED" || status === "REFUSED";
                    const statusKey = STATUS_KEY[status] ?? STATUS_KEY.PENDING;
                    const statusIcon = STATUS_ICON[status] ?? STATUS_ICON.PENDING;
                    const viewLabel = isPreviewOpen ? t("cvPreview.closeBtn") : t("cvDocuments.viewBtn");
                    const mainLabel = isMain ? t("cvDocuments.mainCv") : t("cvDocuments.makeMainBtn");

                    // Student normal state → 2x2 grid. Manager / confirm state → wrapping flex row.
                    const actionsClass = (!isManager && !confirming)
                        ? "grid grid-cols-2 gap-2"
                        : "flex flex-wrap items-center gap-2 md:justify-end";

                    return (
                        <li key={doc.id} aria-busy={busy}>
                            <div className={rowClass}>

                                {/* Column 1 — Identity */}
                                <div className="min-w-0">
                                    <p className={th.name}>{doc.fileName}</p>
                                    {isManager && doc.student && (
                                        <p className={`${th.meta} font-medium`}>
                                            {doc.student.firstName} {doc.student.lastName}
                                            {" · "}{doc.student.studentId}
                                            {" · "}{doc.student.email}
                                            {" · "}{t(`disciplines.${(doc.student.discipline ?? "").toLowerCase()}`, {defaultValue: doc.student.discipline})}
                                        </p>
                                    )}
                                    <p className={th.meta}>
                                        {t("cvDocuments.docType")} · {!isManager && `${formatBytes(doc.sizeBytes, lang)} · `}{t("cvDocuments.uploadedOn")} {formatDate(doc.uploadedAt)}
                                    </p>
                                    {isRejected && doc.rejectionComment && (
                                        <div className={th.rejectionBox} role="note">
                                            <p className={th.rejectionLabel}>{t("cvDocuments.rejectionComment")} :</p>
                                            <p className={`${th.rejectionText} whitespace-pre-wrap`}>{doc.rejectionComment}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Column 2 — Pills */}
                                <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-start">
                                    <span className={`${th.pillBase} ${th.statusPill(status)} gap-1`}>
                                        <Icon name={statusIcon} size={14}/>
                                        {t(statusKey)}
                                    </span>
                                    {!isManager && (
                                        <span
                                            className={`${th.pillBase} ${isPublic ? th.pillPublic : th.pillPrivate} gap-1`}>
                                            <Icon name={isPublic ? "share_reviews" : "lock"} size={14}/>
                                            {isPublic ? t("cvDocuments.scopePublic") : t("cvDocuments.scopePrivate")}
                                        </span>
                                    )}
                                </div>

                                {/* Column 3 — Actions */}
                                <div className={actionsClass}>
                                    {/* Preview stays available in every state (also while rejecting / deleting) */}
                                    <Button tone={isPreviewOpen ? "danger" : "accent"} dark={dark}
                                            icon={isPreviewOpen ? "close" : "visibility"}
                                            onClick={() => togglePreview(doc.id)}
                                            disabled={busy}
                                            className={isManager ? "" : cellBtn}
                                            aria-expanded={isPreviewOpen}
                                            aria-label={`${viewLabel} : ${doc.fileName}`}>
                                        {viewLabel}
                                    </Button>

                                    {confirming ? (
                                        <>
                                            <span className={th.confirmText}>
                                                {isManager
                                                    ? t(isRejected ? "cvDocuments.editRefuseAsk" : "cvDocuments.refuseAsk")
                                                    : t("cvDocuments.hideAsk")}
                                            </span>
                                            {isManager && (
                                                <AutoResizeTextarea
                                                    value={refuseComment}
                                                    onChange={(e) => setRefuseComment(e.target.value)}
                                                    rows={2}
                                                    placeholder={t("cvDocuments.refuseCommentPlaceholder")}
                                                    aria-label={t("cvDocuments.refuseCommentPlaceholder")}
                                                    className={textareaClass}
                                                />
                                            )}
                                            <Button tone="danger" dark={dark} icon="check_circle"
                                                    disabled={busy || (isManager && !refuseComment.trim())} autoFocus
                                                    onClick={() => isManager ? decide(doc, "refuse") : hideDoc(doc)}>
                                                {t("cvDocuments.confirmBtn")}
                                            </Button>
                                            <Button tone="neutral" dark={dark} icon="close" disabled={busy}
                                                    onClick={cancelConfirm}>
                                                {t("cvDocuments.cancelBtn")}
                                            </Button>
                                        </>
                                    ) : isManager ? (
                                        <>
                                            {/* Decision can be changed at any time */}
                                            {!isApproved && (
                                                <Button tone="success" dark={dark} icon="check_circle" disabled={busy}
                                                        onClick={() => decide(doc, "approve")}
                                                        aria-label={`${t("cvDocuments.approveBtn")} : ${doc.fileName}`}>
                                                    {t("cvDocuments.approveBtn")}
                                                </Button>
                                            )}
                                            {isRejected ? (
                                                <Button tone="neutral" dark={dark} icon="edit" disabled={busy}
                                                        onClick={() => startRefuse(doc)}
                                                        aria-label={`${t("cvDocuments.editCommentBtn")} : ${doc.fileName}`}>
                                                    {t("cvDocuments.editCommentBtn")}
                                                </Button>
                                            ) : (
                                                <Button tone="danger" dark={dark} icon="close" disabled={busy}
                                                        onClick={() => startRefuse(doc)}
                                                        aria-label={`${t("cvDocuments.refuseBtn")} : ${doc.fileName}`}>
                                                    {t("cvDocuments.refuseBtn")}
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Order matters for the 2x2 grid: Delete must be last (bottom-right). */}
                                            <Button tone="neutral" dark={dark}
                                                    icon={isPublic ? "lock" : "share_reviews"}
                                                    onClick={() => toggleScope(doc)}
                                                    disabled={busy} className={cellBtn}
                                                    aria-label={`${isPublic ? t("cvDocuments.makePrivate") : t("cvDocuments.makePublic")} : ${doc.fileName}`}>
                                                {isPublic ? t("cvDocuments.makePrivate") : t("cvDocuments.makePublic")}
                                            </Button>
                                            <Button tone="neutral" dark={dark} icon="star" onClick={() => makeMain(doc)}
                                                    disabled={busy || isMain} className={cellBtn}
                                                    aria-label={`${mainLabel} : ${doc.fileName}`}>
                                                {mainLabel}
                                            </Button>
                                            <Button tone="danger" dark={dark} icon="delete"
                                                    onClick={() => setConfirmId(doc.id)}
                                                    disabled={busy} className={cellBtn}
                                                    aria-label={`${t("cvDocuments.hideBtn")} : ${doc.fileName}`}>
                                                {t("cvDocuments.hideBtn")}
                                            </Button>
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
                    {isManager ? t("cvDocuments.titleManager") : t("cvDocuments.title")}
                </h2>
                {!isManager && onAddClick && (
                    <button onClick={onAddClick} className={th.addBtn}>{t("cvDocuments.addBtn")}</button>
                )}
            </div>

            {actionError && (
                <div className="px-6 pt-4">
                    <div className={th.error} role="alert" aria-live="assertive">{t(actionError)}</div>
                </div>
            )}

            {toolbar}

            {body}
        </section>
    );
};

export default CvDocuments;
