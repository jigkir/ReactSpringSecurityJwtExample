/**
 * DocumentList.jsx — The student's documents of ONE type (CV, cover letters or transcripts).
 *
 * CVs also carry a review status (pill + rejection reason), the other types do not:
 * the row simply shows a pill when the document has a `status`.
 *
 * Actions: Preview | Change type (full page only) | Delete (hide, with confirmation).
 * The card header shows the type title and the "Upload files" / "Close" button (full page only).
 * The list is refreshed automatically by useLoadedList (polling), and silently when
 * `reloadToken` changes (the old rows stay on screen until the new ones arrive).
 *
 * Order
 *   ALL tab:   rejected CVs → pending CVs → everything else; newest first inside each group.
 *   Other tab: rejected → pending → approved, newest first inside each status.
 *
 * CV tab: when a status is picked in the filter, every row gets a coloured border
 * (red = rejected, yellow = pending, green = approved), like the manager page.
 *
 * `preview` (Home page): no card shell, only the first MAX_PREVIEW_ITEMS documents,
 * each one its own card.
 *
 * `actionError` stores a translation KEY (not text) so it follows the language switch live.
 * `getUrl` only depends on `type`, so an open PDF preview is not reloaded on a language change.
 *
 * Props
 *   type           "ALL" | "CV" | "COVER_LETTER" | "TRANSCRIPT"
 *   dark           boolean
 *   preview        boolean   optional, compact Home version
 *   reloadToken    number    optional, change it to refetch the list silently
 *   onTypeChanged  function  optional, shows "Change type" and is called once a file was moved
 *   uploadOpen     boolean   the upload panel is open (button shows "Close")
 *   onAddClick     function  opens the upload panel
 *   onCloseClick   function  closes the upload panel
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../../styles/Button.jsx';
import {getSelectClass} from '../../../styles/FormControls.jsx';
import ChangeDocType from './ChangeDocType.jsx';
import DocumentListShell from '../../documents/DocumentListShell.jsx';
import DocumentRow, {getRowListClass, ROW_BTN} from '../../documents/DocumentRow.jsx';
import {getDocumentFile, getDocuments, hideDocument} from '../../api/Api.jsx';
import {getCvDocumentsClasses, getStatusBorder} from '../../../styles/AppStyles.jsx';
import {blobUrlFromFile, formatBytes, formatDate} from '../../../utils/documents.js';
import {DOC_TYPE_KEYS, DOC_TYPES} from '../../../utils/DocumentTypes.js';
import {sortCvsNewest} from '../../../utils/Sort.jsx';
import {useLoadedList} from '../../../utils/useLoadedList.js';
import {useToggleSet} from '../../../utils/useToggleSet.js';
import {MAX_PREVIEW_ITEMS} from '../../home/PreviewLoaders.js';

const ALL = "ALL";

const isVisible = (doc) => (doc.visibility ?? "VISIBLE") === "VISIBLE";
const keyOf = (doc) => `${doc.docType}-${doc.id}`;
const byNewest = (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt);
const ALL_VIEW_RANK = {REJECTED: 0, PENDING: 1};
const allViewRank = (doc) =>
    ALL_VIEW_RANK[doc.status ?? (doc.docType === "CV" ? "PENDING" : "")] ?? 2;
const byStatusThenNewest = (a, b) => allViewRank(a) - allViewRank(b) || byNewest(a, b);

// One stable function per type, so an open PDF preview is never reloaded by a re-render
const urlGetters = {};
const getUrlFor = (type) => (urlGetters[type] ??= async (id) => blobUrlFromFile(await getDocumentFile(type, id)));

export default function DocumentList({
                                         type, dark, preview = false, reloadToken = 0, onTypeChanged,
                                         uploadOpen = false, onAddClick, onCloseClick,
                                     }) {
    const {t, i18n} = useTranslation();
    const th = getCvDocumentsClasses(dark);
    const lang = i18n.resolvedLanguage ?? i18n.language;
    const isAll = type === ALL;
    const hasStatusFilter = type === "CV" && !preview;

    // ALL: every type merged → rejected, then pending, then the rest; newest first inside each group.
    // Otherwise: rejected → pending → approved, newest first.
    const fetchDocs = useCallback(async () => {
        const types = type === ALL ? DOC_TYPE_KEYS : [type];
        const lists = await Promise.all(types.map(async (k) =>
            (await getDocuments(k)).filter(isVisible).map((d) => ({...d, docType: k}))));
        const merged = lists.flat();
        return type === ALL ? merged.sort(byStatusThenNewest) : sortCvsNewest(merged);
    }, [type]);
    const {items: docs, failed, reload} = useLoadedList(fetchDocs);

    // Silent refetch when the parent asks for it (after an upload / a type change)
    const lastToken = useRef(reloadToken);
    useEffect(() => {
        if (lastToken.current === reloadToken) return;
        lastToken.current = reloadToken;
        void reload();
    }, [reloadToken, reload]);

    const previews = useToggleSet();
    const [status, setStatus] = useState("ALL");
    const [busyKey, setBusyKey] = useState(null);
    const [confirmKey, setConfirmKey] = useState(null);
    const [typeEditKey, setTypeEditKey] = useState(null);
    const [actionError, setActionError] = useState("");

    const filtered = docs && hasStatusFilter && status !== "ALL"
        ? docs.filter((d) => (d.status ?? "PENDING") === status)
        : docs;
    const shown = filtered && preview ? filtered.slice(0, MAX_PREVIEW_ITEMS) : filtered;
    const filterHidesAll = Boolean(docs?.length) && shown?.length === 0;
    const bordered = hasStatusFilter && status !== "ALL";

    const remove = async (doc) => {
        const key = keyOf(doc);
        setBusyKey(key);
        setActionError("");
        try {
            await hideDocument(doc.docType, doc.id);
            await reload();
        } catch {
            setActionError("cvDocuments.errorAction");
        } finally {
            setBusyKey(null);
            setConfirmKey(null);
        }
    };

    const renderActions = (doc, busy) => {
        const key = keyOf(doc);

        if (confirmKey === key) {
            return (
                <>
                    <span className={`${th.confirmText} md:text-right`}>{t("cvDocuments.hideAsk")}</span>
                    <Button tone="danger" dark={dark} icon="check_circle" disabled={busy} autoFocus
                            className={ROW_BTN} onClick={() => remove(doc)}>
                        {t("cvDocuments.confirmBtn")}
                    </Button>
                    <Button tone="neutral" dark={dark} icon="close" disabled={busy}
                            className={ROW_BTN} onClick={() => setConfirmKey(null)}>
                        {t("cvDocuments.cancelBtn")}
                    </Button>
                </>
            );
        }

        return (
            <>
                {onTypeChanged && (
                    <ChangeDocType type={doc.docType} id={doc.id} dark={dark}
                                   open={typeEditKey === key}
                                   onOpen={() => setTypeEditKey(key)}
                                   onClose={() => setTypeEditKey(null)}
                                   onChanged={onTypeChanged} className={ROW_BTN}/>
                )}
                {typeEditKey !== key && (
                    <Button tone="danger" dark={dark} icon="delete" disabled={busy} className={ROW_BTN}
                            onClick={() => setConfirmKey(key)}
                            aria-label={`${t("cvDocuments.hideBtn")} : ${doc.fileName}`}>
                        {t("cvDocuments.hideBtn")}
                    </Button>
                )}
            </>
        );
    };

    const rows = shown?.length > 0 && (
        <ul className={getRowListClass(dark, {preview, bordered})}>
            {shown.map((doc) => {
                const key = keyOf(doc);
                const busy = busyKey === key;
                return (
                    <DocumentRow
                        key={key}
                        doc={doc}
                        dark={dark}
                        preview={preview}
                        bordered={bordered}
                        status={doc.status ?? (hasStatusFilter ? "PENDING" : undefined)}
                        busy={busy}
                        isOpen={previews.has(key)}
                        onToggle={() => previews.toggle(key)}
                        getUrl={getUrlFor(doc.docType)}
                        details={
                            <p className={th.meta}>
                                {isAll && <>{t(DOC_TYPES[doc.docType].labelKey)}{" · "}</>}
                                {formatBytes(doc.sizeBytes, lang)}
                                {" · "}{t("cvDocuments.uploadedOn")} {formatDate(doc.uploadedAt)}
                            </p>
                        }
                        actions={renderActions(doc, busy)}
                    />
                );
            })}
        </ul>
    );

    // Status filter (CV tab only). The border takes the colour of the chosen status.
    const toolbar = hasStatusFilter && docs !== null && !failed && (
        <div className={`flex flex-wrap items-center gap-2 px-6 py-3 border-b ${dark ? "border-slate-700" : "border-gray-200"}`}>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className={getSelectClass(dark, getStatusBorder(status, dark))}
                    aria-label={t("cvDocuments.statusAria")}>
                <option value="ALL">{t("cvDocuments.allStatuses")}</option>
                <option value="REJECTED">{t("cvDocuments.statusRefused")}</option>
                <option value="PENDING">{t("cvDocuments.filterPending")}</option>
                <option value="APPROVED">{t("cvDocuments.statusApproved")}</option>
            </select>
        </div>
    );

    // Title on the left, "Upload files" / "Close" on the right
    const headerAction = onAddClick && (
        uploadOpen && onCloseClick ? (
            <Button tone="ghost" dark={dark} icon="close" onClick={onCloseClick}>
                {t("portfolio.close")}
            </Button>
        ) : (
            <Button tone="primary" dark={dark} icon="upload_file" onClick={onAddClick}>
                {t("portfolio.upload")}
            </Button>
        )
    );

    const label = t(isAll ? "portfolio.allTab" : DOC_TYPES[type].labelKey);

    return (
        <DocumentListShell
            dark={dark}
            preview={preview}
            title={preview ? undefined : label}
            headerAction={preview ? undefined : headerAction}
            label={label}
            items={shown}
            failed={failed}
            onRetry={reload}
            emptyText={t(filterHidesAll ? "portfolio.noMatch" : "portfolio.empty")}
            actionError={actionError}
            toolbar={toolbar}
        >
            {rows}
        </DocumentListShell>
    );
}