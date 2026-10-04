/**
 * Manager page: review internship offers.
 *  - Approve directly.
 *  - Reject only with a mandatory reason (comment).
 *  - A decision can be changed at any time (approve a rejected offer, reject an approved one,
 *    or edit the rejection reason).
 *
 * `actionError` stores a translation KEY (not text) and is translated at render,
 * so it follows the language switch live.
 *
 * Access control: <RequireRole roles={["MANAGER"]}/> in App.jsx + backend.
 */

import {useCallback, useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import InternshipCard from '../internship/InternshipCard.jsx';
import InternshipFilters, {useInternshipFilters} from '../internship/InternshipFilters.jsx';
import AutoResizeTextarea from '../../../utils/AutoResizeTextarea.jsx';
import Button from '../../../styles/Button.jsx';
import {getPostInternshipClasses} from '../../../styles/AppStyles.jsx';
import {approveInternship, getManagerInternships, rejectInternship} from '../../api/Api.jsx';

const ManagerInternships = () => {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const s = getPostInternshipClasses(dark);

    const [internships, setInternships] = useState(null); // null = loading
    const [loadFailed, setLoadFailed] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [confirmId, setConfirmId] = useState(null); // offer whose reject form is open
    const [rejectComment, setRejectComment] = useState("");
    const [actionError, setActionError] = useState("");

    const filters = useInternshipFilters(internships);
    const visible = filters.visible ?? [];

    const textareaClass = `w-full md:max-w-sm rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    const load = useCallback(async () => {
        setLoadFailed(false);
        try {
            setInternships(await getManagerInternships());
        } catch {
            setLoadFailed(true);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const closeForm = () => {
        setConfirmId(null);
        setRejectComment("");
    };

    // The backend returns the updated offer; patch it into the list so the card stays visible.
    const decide = async (internship, action) => {
        setBusyId(internship.id);
        setActionError("");
        try {
            const updated = action === "approve"
                ? await approveInternship(internship.id)
                : await rejectInternship(internship.id, rejectComment.trim());
            setInternships((prev) => prev.map((i) => (i.id === internship.id ? {...i, ...updated} : i)));
            closeForm();
        } catch (e) {
            if (e.status === 404) {
                setActionError("managerInternships.notFound");
                await load();
                closeForm();
            } else {
                setActionError("managerInternships.actionFailed");
            }
        } finally {
            setBusyId(null);
        }
    };

    const startReject = (internship) => {
        setConfirmId(internship.id);
        // When editing an existing rejection, pre-fill the old reason
        setRejectComment(internship.rejectionComment ?? "");
    };

    const renderActions = (internship) => {
        const busy = busyId === internship.id;
        const isApproved = internship.status === "APPROVED";
        const isRejected = internship.status === "REJECTED";

        if (confirmId === internship.id) {
            return (
                <>
                    <span className={`text-sm ${dark ? "text-slate-300" : "text-gray-700"}`}>
                        {isRejected
                            ? t("managerInternships.editRejectAsk")
                            : t("managerInternships.rejectAsk")}
                    </span>
                    <AutoResizeTextarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        rows={2}
                        autoFocus
                        placeholder={t("managerInternships.rejectPlaceholder")}
                        aria-label={t("managerInternships.rejectAria")}
                        className={textareaClass}
                    />
                    <Button tone="danger" dark={dark} icon="check"
                            disabled={busy || !rejectComment.trim()}
                            onClick={() => decide(internship, "reject")}>
                        {t("managerInternships.confirmBtn")}
                    </Button>
                    <Button tone="neutral" dark={dark} icon="close" disabled={busy} onClick={closeForm}>
                        {t("managerInternships.cancelBtn")}
                    </Button>
                </>
            );
        }

        return (
            <>
                {/* Decision can be changed at any time */}
                {!isApproved && (
                    <Button tone="success" dark={dark} icon="check" disabled={busy}
                            onClick={() => decide(internship, "approve")}
                            aria-label={t("managerInternships.approveBtnAria", {title: internship.title})}>
                        {t("managerInternships.approveBtn")}
                    </Button>
                )}
                {isRejected ? (
                    <Button tone="neutral" dark={dark} icon="edit" disabled={busy}
                            onClick={() => startReject(internship)}
                            aria-label={t("managerInternships.editReasonBtnAria", {title: internship.title})}>
                        {t("managerInternships.editReasonBtn")}
                    </Button>
                ) : (
                    <Button tone="danger" dark={dark} icon="close" disabled={busy}
                            onClick={() => startReject(internship)}
                            aria-label={t("managerInternships.rejectBtnAria", {title: internship.title})}>
                        {t("managerInternships.rejectBtn")}
                    </Button>
                )}
            </>
        );
    };

    let body;
    if (loadFailed) {
        body = (
            <div className={s.errorText} role="alert">
                <p>{t("managerInternships.loadError")}</p>
                <Button tone="neutral" dark={dark} onClick={load} className="mt-3">
                    {t("managerInternships.retryBtn")}
                </Button>
            </div>
        );
    } else if (internships === null) {
        body = <p className={s.loadingText} aria-busy="true">{t("managerInternships.loading")}</p>;
    } else if (internships.length === 0) {
        body = <p className={s.emptyText}>{t("managerInternships.empty")}</p>;
    } else if (visible.length === 0) {
        body = <p className={s.emptyText}>{t("internshipFilters.noMatch")}</p>;
    } else {
        body = visible.map((internship) => (
            <InternshipCard
                key={internship.id}
                internship={internship}
                dark={dark}
                footer={renderActions(internship)}
            />
        ));
    }

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("managerInternships.title")}</h1>
                    <p className={s.subtitle}>{t("managerInternships.subtitle")}</p>
                </div>
            </div>

            <div className={s.listSection}>
                {actionError && <p className={`${s.errorText} mb-4`} role="alert">{t(actionError)}</p>}
                {internships && internships.length > 0 && <InternshipFilters dark={dark} filters={filters}/>}
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
};

export default ManagerInternships;