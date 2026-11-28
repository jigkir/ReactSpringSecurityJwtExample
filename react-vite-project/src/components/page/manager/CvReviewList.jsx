/**
 * CvReviewList.jsx — Manager view of every visible student CV.
 *
 * Filter / sort (status color, discipline, search, date, student), preview, approve and refuse
 * (with a mandatory reason). A decision can be changed at any time.
 * A CV is visible to the manager as soon as the student uploads it.
 *
 * The backend returns the CVs of the students of the selected session.
 *
 * Filtering / sorting logic lives in utils/Sort.jsx (useCvFilters). The status filter is a color
 * (ALL | RED | YELLOW | GREEN, see StatusColor.js); its initial value comes from `?status=`.
 *
 * The backend returns the updated DTO after a decision: it is patched into the list so the row
 * stays visible with its new status (and is re-filtered by the status filter automatically).
 *
 * `actionError` stores a translation KEY (not text) so it follows the language switch live.
 *
 * List fields: id, fileName, uploadedAt, status, rejectionComment,
 *              student {id, firstName, lastName, email, studentId, discipline}
 * The PDF itself (Base64 `content`) is fetched on demand: GET manager/cvs/{cvId}/file
 *
 * Props
 *   dark     boolean
 */

import {useCallback, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/Button.jsx";
import AutoResizeTextarea from "../../../styles/AutoResizeTextarea.jsx";
import {getSelectClass, SearchInput} from "../../../styles/FormControls.jsx";
import DocumentListShell from "../../documents/DocumentListShell.jsx";
import DocumentRow, {getRowListClass, ROW_BTN} from "../../documents/DocumentRow.jsx";
import {approveCv, getManagerCvFile, getPublicCvs, rejectCv} from "../../api/Api.jsx";
import {getCvDocumentsClasses} from "../../../styles/AppStyles.jsx";
import {TARGET_TYPE, useCloseShownNotifications, useNotifications} from "../../notification/NotificationsProvider.jsx";
import {blobUrlFromFile, formatDate} from "../../../utils/Documents.js";
import {CV_SORT_OPTIONS, StatusColorSelect, useCvFilters} from "../../../utils/Sort.jsx";
import {ALL} from "../../../utils/StatusColor.js";
import {useLoadedList} from "../../../utils/useLoadedList.js";
import {useToggleSet} from "../../../utils/useToggleSet.js";
import {useSession} from "../../../utils/useSession.js";

// Module-level: a stable reference, so an open PDF preview is never reloaded by a re-render
const getUrl = async (id) => blobUrlFromFile(await getManagerCvFile(id));

const statusOf = (doc) => doc.status ?? "PENDING";

function CvReviewList({dark}) {
    const {t, i18n} = useTranslation();
    const {refresh: refreshNotifications} = useNotifications();
    const th = getCvDocumentsClasses(dark);

    const {selectedSession} = useSession();

    const lang = i18n.resolvedLanguage ?? i18n.language;

    const loadCvs = useCallback(async () => {
        return selectedSession ? getPublicCvs(selectedSession.id) : null;
    }, [selectedSession, lang]);

    const {items: docs, setItems: setDocs, failed, reload} = useLoadedList(loadCvs);
    const filters = useCvFilters(docs);

    const shownCvIds = useMemo(() => (docs ? docs.map((doc) => doc.id) : null), [docs]);
    useCloseShownNotifications(TARGET_TYPE.CV, shownCvIds);

    const previews = useToggleSet();
    const [busyId, setBusyId] = useState(null);
    const [confirmId, setConfirmId] = useState(null); // CV whose refuse form is open
    const [refuseComment, setRefuseComment] = useState("");
    const [actionError, setActionError] = useState("");

    const selectClass = getSelectClass(dark);
    const textareaClass = `${selectClass} w-full md:w-64`;
    // Rows get a coloured border only while a status color is selected
    const bordered = filters.status !== ALL;

    const shown = docs === null ? null : filters.visible;

    // ── Decision ──────────────────────────────────────────────────────────────

    const decide = async (doc, action) => {
        setBusyId(doc.id);
        setActionError("");
        try {
            const updated = action === "refuse"
                ? await rejectCv(doc.id, refuseComment.trim())
                : await approveCv(doc.id);
            setDocs((prev) => prev.map((d) => (d.id === doc.id ? {...d, ...updated} : d)));
            void refreshNotifications();
        } catch (e) {
            if (e.status === 409) {
                setActionError("cvDocuments.alreadyReviewed");
                await reload();
            } else {
                setActionError("cvDocuments.errorAction");
            }
        } finally {
            setBusyId(null);
            setConfirmId(null);
            setRefuseComment("");
        }
    };

    // Opens the refuse form. When editing an existing rejection, the old reason is pre-filled.
    const startRefuse = (doc) => {
        setConfirmId(doc.id);
        setRefuseComment(doc.rejectionComment ?? "");
    };

    const cancelRefuse = () => {
        setConfirmId(null);
        setRefuseComment("");
    };

    const renderActions = (doc, status, busy) => {
        const isRejected = status === "REJECTED";

        if (confirmId === doc.id) {
            return (
                <>
                    <span className={`${th.confirmText} @2xl:text-right`}>
                        {t(isRejected ? "cvDocuments.editRefuseAsk" : "cvDocuments.refuseAsk")}
                    </span>
                    <AutoResizeTextarea
                        value={refuseComment}
                        onChange={(e) => setRefuseComment(e.target.value)}
                        rows={2}
                        placeholder={t("cvDocuments.refuseCommentPlaceholder")}
                        aria-label={t("cvDocuments.refuseCommentPlaceholder")}
                        className={textareaClass}
                    />
                    <Button tone="danger" dark={dark} icon="check_circle" autoFocus className={ROW_BTN}
                            disabled={busy || !refuseComment.trim()}
                            onClick={() => decide(doc, "refuse")}>
                        {t("cvDocuments.confirmBtn")}
                    </Button>
                    <Button tone="neutral" dark={dark} icon="close" disabled={busy} className={ROW_BTN}
                            onClick={cancelRefuse}>
                        {t("cvDocuments.cancelBtn")}
                    </Button>
                </>
            );
        }

        return (
            <>
                {/* Decision can be changed at any time */}
                {status !== "APPROVED" && (
                    <Button tone="success" dark={dark} icon="check_circle" disabled={busy} className={ROW_BTN}
                            onClick={() => decide(doc, "approve")}
                            aria-label={`${t("cvDocuments.approveBtn")} : ${doc.fileName}`}>
                        {t("cvDocuments.approveBtn")}
                    </Button>
                )}
                {isRejected ? (
                    <Button tone="neutral" dark={dark} icon="edit" disabled={busy} className={ROW_BTN}
                            onClick={() => startRefuse(doc)}
                            aria-label={`${t("cvDocuments.editCommentBtn")} : ${doc.fileName}`}>
                        {t("cvDocuments.editCommentBtn")}
                    </Button>
                ) : !doc.usedInApplication && (
                    // A CV used in an application stays approved
                    <Button tone="danger" dark={dark} icon="close" disabled={busy} className={ROW_BTN}
                            onClick={() => startRefuse(doc)}
                            aria-label={`${t("cvDocuments.refuseBtn")} : ${doc.fileName}`}>
                        {t("cvDocuments.refuseBtn")}
                    </Button>
                )}
            </>
        );
    };

    // ── Toolbar (once the list is loaded) ─────────────────────────────────────

    const toolbar = docs !== null && !failed && (
        <div
            className={`flex flex-wrap items-center gap-2 px-6 py-3 border-b ${dark ? "border-slate-700" : "border-gray-200"}`}>
            <SearchInput
                dark={dark}
                value={filters.search}
                onChange={filters.setSearch}
                placeholder={t("cvDocuments.searchPlaceholder")}
                ariaLabel={t("cvDocuments.searchAria")}
                clearAriaLabel={t("cvDocuments.clearSearchAria")}
            />
            <StatusColorSelect dark={dark} value={filters.status} onChange={filters.setStatus} page="managerCv"
                               ariaLabel={t("cvDocuments.statusAria")}/>
            <select value={filters.discipline} onChange={(e) => filters.setDiscipline(e.target.value)}
                    className={selectClass} aria-label={t("cvDocuments.disciplineAria")}>
                <option value="ALL">{t("cvDocuments.allDisciplines")}</option>
                {filters.disciplines.map((d) => (
                    <option key={d} value={d}>{t(`disciplines.${d.toLowerCase()}`, {defaultValue: d})}</option>
                ))}
            </select>
            <select value={filters.sort} onChange={(e) => filters.setSort(e.target.value)}
                    className={selectClass} aria-label={t("cvDocuments.sortAria")}>
                {CV_SORT_OPTIONS.map(([value, key]) => (
                    <option key={value} value={value}>{t(key)}</option>
                ))}
            </select>
        </div>
    );

    // ── Rows ──────────────────────────────────────────────────────────────────

    const rows = shown?.length > 0 && (
        <ul className={getRowListClass(dark, {bordered})}>
            {shown.map((doc) => {
                const status = statusOf(doc);
                const busy = busyId === doc.id;
                const {student} = doc;
                return (
                    <DocumentRow
                        key={doc.id}
                        doc={{...doc, docType: "CV"}}
                        dark={dark}
                        bordered={bordered}
                        audience="manager"
                        status={status}
                        busy={busy}
                        isOpen={previews.has(doc.id)}
                        onToggle={() => previews.toggle(doc.id)}
                        getUrl={getUrl}
                        details={
                            <>
                                {student && (
                                    <p className={`${th.meta} font-medium`}>
                                        {student.firstName} {student.lastName}
                                        {" · "}{student.studentId}
                                        {" · "}{student.email}
                                        {" · "}{t(`disciplines.${(student.discipline ?? "").toLowerCase()}`, {defaultValue: student.discipline})}
                                    </p>
                                )}
                                <p className={`${th.meta} first-letter:uppercase`}>
                                    {t("cvDocuments.uploadedOn")} {formatDate(doc.uploadedAt)}
                                </p>
                            </>
                        }
                        actions={renderActions(doc, status, busy)}
                    />
                );
            })}
        </ul>
    );

    return (
        <DocumentListShell
            dark={dark}
            title={t("cvDocuments.titleManager")}
            items={shown}
            failed={failed}
            onRetry={reload}
            emptyText={t("cvDocuments.emptyManager")}
            actionError={actionError}
            toolbar={toolbar}
        >
            {rows}
        </DocumentListShell>
    );
}

export default CvReviewList;