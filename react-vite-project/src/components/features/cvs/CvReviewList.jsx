


import {useCallback, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/ui/Button.jsx";
import AutoResizeTextarea from "../../../styles/ui/AutoResizeTextarea.jsx";
import {getSelectClass, SearchInput} from "../../../styles/ui/FormControls.jsx";
import DocumentListShell from "../../shared/documents/DocumentListShell.jsx";
import DocumentRow, {getRowListClass, ROW_BTN} from "../../shared/documents/DocumentRow.jsx";
import {approveCv, getManagerCvFile, getPublicCvs, rejectCv} from "../../shared/core/api/Api.jsx";
import {getCvDocumentsClasses} from "../../../styles/theme/AppStyles.jsx";
import {TARGET_TYPE, useCloseShownNotifications, useNotifications} from "../../shared/notification/NotificationsProvider.jsx";
import {blobUrlFromFile, formatDate} from "../../../utils/documents/Documents.js";
import {CV_SORT_OPTIONS, StatusColorSelect, useCvFilters} from "../../../utils/sorting/Sort.jsx";
import {ALL} from "../../../utils/status/StatusColor.js";
import {useLoadedList} from "../../../utils/hooks/useLoadedList.js";
import {useToggleSet} from "../../../utils/hooks/useToggleSet.js";
import {useSession} from "../../../utils/session/useSession.js";


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
    const [confirmId, setConfirmId] = useState(null);
    const [refuseComment, setRefuseComment] = useState("");
    const [actionError, setActionError] = useState("");

    const selectClass = getSelectClass(dark);
    const textareaClass = `${selectClass} w-full md:w-64`;

    const bordered = filters.status !== ALL;

    const shown = docs === null ? null : filters.visible;



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

                    <Button tone="danger" dark={dark} icon="close" disabled={busy} className={ROW_BTN}
                            onClick={() => startRefuse(doc)}
                            aria-label={`${t("cvDocuments.refuseBtn")} : ${doc.fileName}`}>
                        {t("cvDocuments.refuseBtn")}
                    </Button>
                )}
            </>
        );
    };



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
