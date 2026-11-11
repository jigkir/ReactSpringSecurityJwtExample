/**
 * DocumentRow.jsx — One row of any document list (student portfolio, manager CV review).
 *
 * Layout (md and up): [ identity ] [ status pill (optional) ] [ actions ]
 * Below md everything stacks vertically. The Preview / Close toggle is always the first
 * action (blue while closed, RED while the preview is open); the inline PDF preview opens
 * under the row.
 *
 * The Preview label names the document: "Preview CV", "Preview cover letter", "Preview transcript"
 * (from doc.docType). Without a docType (manager CV page) it falls back to the generic label.
 *
 * Props
 *   doc        {id, fileName, docType?, rejectionComment?}
 *   dark       boolean
 *   status     "PENDING" | "APPROVED" | "REJECTED" | undefined   (no pill when undefined)
 *   leading    node     optional, shown before the file name (e.g. a checkbox)
 *   details    node     extra lines under the file name
 *   actions    node     buttons under the preview toggle (give them className={ROW_BTN})
 *   busy       boolean  disables the row while an action runs
 *   isOpen     boolean  inline preview open
 *   onToggle   function toggles the preview
 *   getUrl     (id) => Promise<string>   stable reference
 *   preview    boolean  Home preview: every row is its own card
 *   bordered   boolean  coloured border from the status (manager, status filter active)
 */

import {useTranslation} from 'react-i18next';
import Button from '../../styles/Button.jsx';
import Icon from '../../styles/Icon.jsx';
import PdfPreview from './PdfPreview.jsx';
import {getCvDocumentsClasses, getStatusBorder} from '../../styles/AppStyles.jsx';

// Full-width buttons inside the vertical action stack
export const ROW_BTN = "w-full";

const STATUS_KEY = {
    PENDING: "cvDocuments.statusPending",
    APPROVED: "cvDocuments.statusApproved",
    REJECTED: "cvDocuments.statusRefused",
};

const MANAGER_STATUS_KEY = {
    PENDING: "managerStatus.pending",
    APPROVED: "managerStatus.approved",
    REJECTED: "managerStatus.rejected",
};

const STATUS_ICON = {
    PENDING: "schedule",
    APPROVED: "check_circle",
    REJECTED: "close",
};

// Class of the <ul> that holds the rows
export const getRowListClass = (dark, {preview = false, bordered = false} = {}) => {
    if (preview) return "flex flex-col gap-4";
    if (bordered) return "flex flex-col gap-3 p-4";
    return getCvDocumentsClasses(dark).list;
};

function DocumentRow({
                         doc, dark, status, leading, details, actions, busy = false,
                         isOpen, onToggle, getUrl, preview = false, bordered = false,
                         audience = "student",
                     }) {
    const {t} = useTranslation();
    const th = getCvDocumentsClasses(dark);
    const statusKeys = audience === "manager" ? MANAGER_STATUS_KEY : STATUS_KEY;
    const previewKey = doc.docType ? `portfolio.actions.preview.${doc.docType}` : "cvDocuments.viewBtn";
    const viewLabel = isOpen ? t("cvPreview.closeBtn") : t(previewKey);

    const columns = status
        ? "@2xl:grid-cols-[minmax(12rem,1fr)_auto_auto]"
        : "@2xl:grid-cols-[minmax(12rem,1fr)_auto]";
    const rowClass = `grid grid-cols-1 gap-4 px-6 py-4 ${columns} @2xl:items-center @2xl:gap-6 transition-colors duration-150 ${
        dark ? "hover:bg-slate-700/40" : "hover:bg-gray-50"
    }`;

    let itemClass = "@container";
    if (preview) itemClass += ` ${th.card} overflow-hidden`;
    else if (bordered) itemClass += ` rounded-xl border-2 ${getStatusBorder(status, dark) ?? ""}`;

    return (
        <li aria-busy={busy} className={itemClass}>
            <div className={rowClass}>
                {/* Identity */}
                <div className="flex min-w-0 items-start gap-3">
                    {leading}
                    <div className="min-w-0 flex-1">
                        <p className={th.name}>{doc.fileName}</p>
                        {details}
                        {status === "REJECTED" && doc.rejectionComment && (
                            <div className={th.rejectionBox} role="note">
                                <p className={th.rejectionLabel}>{t("cvDocuments.rejectionComment")} :</p>
                                <p className={`${th.rejectionText} whitespace-pre-wrap`}>{doc.rejectionComment}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status pill */}
                {status && (
                    <div className="flex flex-wrap items-center gap-2 @2xl:flex-col @2xl:items-start">
                        <span className={`${th.pillBase} ${th.statusPill(status)} gap-1`}>
                            <Icon name={STATUS_ICON[status] ?? STATUS_ICON.PENDING} size={14}/>
                            {t(statusKeys[status] ?? statusKeys.PENDING)}
                        </span>
                    </div>
                )}

                {/* Actions: one vertical stack, every button the same width */}
                <div className="flex flex-col items-stretch gap-2 @2xl:min-w-44 @2xl:justify-self-end">
                    {/* Preview stays available in every state (also while rejecting / deleting).
                        Red while the preview is open, like the employer side. */}
                    <Button tone={isOpen ? "danger" : "accent"} lockTone dark={dark}
                            icon={isOpen ? "close" : "visibility"}
                            onClick={onToggle}
                            disabled={busy}
                            className={ROW_BTN}
                            aria-expanded={isOpen}
                            aria-label={`${viewLabel} : ${doc.fileName}`}>
                        {viewLabel}
                    </Button>
                    {actions}
                </div>
            </div>

            {isOpen && (
                <div className={preview ? "px-4 pb-4" : "py-4"}>
                    <PdfPreview doc={doc} dark={dark} getUrl={getUrl}/>
                </div>
            )}
        </li>
    );
}

export default DocumentRow;