


import {useTranslation} from "react-i18next";
import Button from "../../../styles/ui/Button.jsx";
import Icon from "../../../styles/ui/Icon.jsx";
import PdfPreview from "./PdfPreview.jsx";
import {getCvDocumentsClasses, getStatusBorder} from "../../../styles/theme/AppStyles.jsx";


export const ROW_BTN = "w-full min-w-0 text-center";

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


export const getRowListClass = (dark, {bordered = false} = {}) => {
    if (bordered) return "flex flex-col gap-3 p-4";
    return getCvDocumentsClasses(dark).list;
};

function DocumentRow({
                         doc, dark, status, leading, details, actions, busy = false,
                         isOpen, onToggle, getUrl, bordered = false,
                         audience = "student",
                     }) {
    const {t} = useTranslation();
    const th = getCvDocumentsClasses(dark);
    const statusKeys = audience === "manager" ? MANAGER_STATUS_KEY : STATUS_KEY;
    const previewKey = doc.docType ? `portfolio.actions.preview.${doc.docType}` : "cvDocuments.viewBtn";
    const viewLabel = isOpen ? t("cvPreview.closeBtn") : t(previewKey);

    const columns = status
        ? "@2xl:grid-cols-[minmax(0,1fr)_fit-content(13rem)_fit-content(14rem)]"
        : "@2xl:grid-cols-[minmax(0,1fr)_fit-content(14rem)]";
    const rowClass = `grid grid-cols-1 gap-4 px-4 py-4 sm:px-6 ${columns} @2xl:items-center @2xl:gap-6 transition-colors duration-150 ${
        dark ? "hover:bg-slate-700/40" : "hover:bg-gray-50"
    }`;

    let itemClass = "@container min-w-0 max-w-full";
    if (bordered) itemClass += ` rounded-xl border-2 ${getStatusBorder(status, dark) ?? ""}`;

    return (
        <li aria-busy={busy} className={itemClass}>
            <div className={rowClass}>

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


                {status && (
                    <div className="flex min-w-0 flex-wrap items-center gap-2 @2xl:flex-col @2xl:items-start">
                        <span className={`${th.pillBase} ${th.statusPill(status)} gap-1 text-left`}>
                            <Icon name={STATUS_ICON[status] ?? STATUS_ICON.PENDING} size={14} className="shrink-0"/>
                            <span className="min-w-0 wrap-break-word">
                                {t(statusKeys[status] ?? statusKeys.PENDING)}
                            </span>
                        </span>
                    </div>
                )}


                <div className="flex min-w-0 flex-col items-stretch gap-2 @2xl:justify-self-end @2xl:w-full">
                    <Button tone={isOpen ? "danger" : "accent"} lockTone dark={dark}
                            icon={isOpen ? "visibility_off" : "visibility"}
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
                <div className="py-4">
                    <PdfPreview doc={doc} dark={dark} getUrl={getUrl}/>
                </div>
            )}
        </li>
    );
}

export default DocumentRow;
