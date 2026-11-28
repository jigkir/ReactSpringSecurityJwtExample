


import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import InternshipCard from "./InternshipCard.jsx";
import InternshipFilters, {useInternshipFilters} from "./InternshipFilters.jsx";
import InternshipForm from "./InternshipForm.jsx";
import AutoResizeTextarea from "../../../styles/ui/AutoResizeTextarea.jsx";
import Button from "../../../styles/ui/Button.jsx";
import {getPostInternshipClasses} from "../../../styles/theme/AppStyles.jsx";
import {
    approveInternship,
    getManagerInternships,
    rejectInternship,
    updateManagerInternship
} from "../../shared/core/api/Api.jsx";
import {TARGET_TYPE, useCloseShownNotifications, useNotifications} from "../../shared/notification/NotificationsProvider.jsx";
import {usePolling} from "../../../utils/hooks/usePolling.js";
import {useSession} from "../../../utils/session/useSession.js";

const ManagerInternships = () => {
    const {dark} = useOutletContext();
    const {t, i18n} = useTranslation();
    const {refresh: refreshNotifications} = useNotifications();
    const {selectedSession} = useSession();

    const canChangeOffers = Boolean(selectedSession?.target);
    const s = getPostInternshipClasses(dark);

    const [internships, setInternships] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [rejectComment, setRejectComment] = useState("");
    const [actionError, setActionError] = useState("");
    const [editing, setEditing] = useState(null);
    const formRef = useRef(null);

    const filters = useInternshipFilters(internships);
    const visible = filters.visible ?? [];

    const lang = i18n.resolvedLanguage ?? i18n.language;

    const shownInternshipIds = useMemo(
        () => (internships ? internships.map((internship) => internship.id) : null),
        [internships],
    );
    useCloseShownNotifications(TARGET_TYPE.INTERNSHIP_OFFER, shownInternshipIds);

    const textareaClass = `w-full md:max-w-sm rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900"
    }`;

    const load = useCallback(async () => {
        if (!selectedSession) return;
        setLoadFailed(false);
        try {
            setInternships(await getManagerInternships(selectedSession.id));
        } catch {
            setLoadFailed(true);
        }
    }, [selectedSession, lang]);

    useEffect(() => {
        load();
    }, [load]);

    usePolling(load);


    useEffect(() => {
        if (editing) formRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
    }, [editing]);

    const closeForm = () => {
        setConfirmId(null);
        setRejectComment("");
    };


    const openEdit = (internship) => {
        closeForm();
        setActionError("");
        setEditing(internship);
    };


    const handleSaveEdit = async (payload) => {
        try {
            const updated = await updateManagerInternship(editing.id, payload);
            setInternships((prev) => prev.map((i) => (i.id === editing.id ? {...i, ...updated} : i)));
            return {success: true};
        } catch (err) {
            return {success: false, message: err.i18n ?? {key: "managerInternships.actionFailed"}};
        }
    };


    const decide = async (internship, action) => {
        setBusyId(internship.id);
        setActionError("");
        try {
            const updated = action === "approve"
                ? await approveInternship(internship.id)
                : await rejectInternship(internship.id, rejectComment.trim());
            setInternships((prev) => prev.map((i) => (i.id === internship.id ? {...i, ...updated} : i)));
            closeForm();
            void refreshNotifications();
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

        setRejectComment(internship.rejectionComment ?? "");
    };

    const renderActions = (internship) => {
        if (!canChangeOffers) return null;

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

                {isApproved && !internship.hasApplications && (
                    <Button tone="warning" dark={dark} icon="edit" disabled={busy}
                            onClick={() => openEdit(internship)}
                            aria-label={t("managerInternships.editBtnAria", {title: internship.title})}>
                        {t("managerInternships.editBtn")}
                    </Button>
                )}


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

    const renderCard = (internship) => (
        <InternshipCard
            key={internship.id}
            internship={internship}
            dark={dark}
            showEmployer
            audience="manager"
            showStatusBorder={filters.status !== "ALL"}
            footer={renderActions(internship)}
        />
    );

    const errorLine = actionError && <p className={`${s.errorText} mb-4`} role="alert">{t(actionError)}</p>;

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
        body = visible.map(renderCard);
    }

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("managerInternships.title")}</h1>
                    <p className={s.subtitle}>{t("managerInternships.subtitle")}</p>
                </div>
            </div>


            {editing && (
                <div ref={formRef} className="scroll-mt-20">
                    <InternshipForm
                        key={editing.id}
                        internship={editing}
                        dark={dark}
                        onClose={() => setEditing(null)}
                        onSubmitInternship={handleSaveEdit}
                    />
                </div>
            )}

            <div className={s.listSection}>
                {errorLine}
                {internships && internships.length > 0 &&
                    <InternshipFilters dark={dark} filters={filters} showDiscipline statusPage="managerInternships"/>}
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
};

export default ManagerInternships;
