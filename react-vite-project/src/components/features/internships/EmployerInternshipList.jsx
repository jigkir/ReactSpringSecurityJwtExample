import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import InternshipForm from "./InternshipForm.jsx";
import InternshipCard from "./InternshipCard.jsx";
import InternshipFilters, {useInternshipFilters} from "./InternshipFilters.jsx";
import Button from "../../../styles/ui/Button.jsx";
import {translateWarning} from "../../../utils/forms/CommonFields.jsx";
import {EMPLOYER_INTERNSHIP_STATUS_RANK} from "../../../utils/sorting/Sort.jsx";
import {getPostInternshipClasses} from "../../../styles/theme/AppStyles.jsx";
import {
    createInternship,
    deleteInternship,
    getApplicationCount,
    getEmployerInternships,
    updateInternship,
    getInternshipIdsWithContract
} from "../../shared/core/api/Api.jsx";
import {usePolling} from "../../../utils/hooks/usePolling.js";
import {useSession} from "../../../utils/session/useSession.js";
import {TARGET_TYPE, useCloseShownNotifications} from "../../shared/notification/NotificationsProvider.jsx";

const HTTP_CONFLICT = 409;


function PostInternship({user}) {
    const {dark} = useOutletContext();
    const {t, i18n} = useTranslation();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [internships, setInternships] = useState([]);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [loading, setLoading] = useState(true);
    const [applicationCount, setApplicationCount] = useState({})
    const [internshipIdsWithContract, setInternshipIdsWithContract] = useState(new Set());
    const formRef = useRef(null);
    const {selectedSession} = useSession();
    const canEditOffers = Boolean(selectedSession?.target);


    const canEdit = (internship) => canEditOffers && !applicationCount[internship.id];

    const canDelete = (internship) => !internshipIdsWithContract.has(internship.id);

    const s = getPostInternshipClasses(dark);
    const filters = useInternshipFilters(internships, null, EMPLOYER_INTERNSHIP_STATUS_RANK);
    const visible = filters.visible ?? [];

    const lang = i18n.resolvedLanguage ?? i18n.language;

    const shownInternshipIds = useMemo(
        () => (loading ? null : internships.map((internship) => internship.id)),
        [loading, internships]);
    useCloseShownNotifications(TARGET_TYPE.INTERNSHIP_OFFER, shownInternshipIds);

    const isLoggedIn = Boolean(user?.isLoggedIn);

    const load = useCallback(async () => {
        if (!selectedSession) return;
        try {
            setInternships(await getEmployerInternships(selectedSession.id));
            setError("");
        } catch {
            setError({key: "postInternship.loadError"});
        } finally {
            setLoading(false);
        }
    }, [selectedSession, lang]);

    const fetchInternshipLocks = useCallback(async () => {
        try {
            const [countData, idsWithContract] = await Promise.all([getApplicationCount(), getInternshipIdsWithContract()]);
            setApplicationCount(countData);
            setInternshipIdsWithContract(new Set(idsWithContract));
        } catch {
            setError({key: "postInternship.countError"});
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) void fetchInternshipLocks();
    }, [isLoggedIn, fetchInternshipLocks]);

    usePolling(fetchInternshipLocks, isLoggedIn)

    useEffect(() => {
        if (isLoggedIn) void load();
    }, [isLoggedIn, load]);

    usePolling(load, isLoggedIn);


    useEffect(() => {
        if (formOpen) formRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
    }, [formOpen, editing]);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (internship) => {
        setEditing(internship);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditing(null);
    };


    const handleSaveInternship = async (payload) => {
        try {
            if (editing) {
                const updated = await updateInternship(editing.id, payload);
                setInternships((prev) => prev.map((i) => (i.id === editing.id ? {...i, ...updated} : i)));
            } else {
                const saved = await createInternship(payload);
                setInternships((prev) => [saved, ...prev]);
            }
            return {success: true};
        } catch (err) {
            if (editing && err.status === HTTP_CONFLICT) return {
                success: false,
                message: {key: "postInternship.editLockedError"}
            };
            return {success: false, message: err.i18n ?? {key: "postInternship.createGenericError"}};
        }
    };

    const handleDelete = async (id) => {
        setActionError("");
        try {
            await deleteInternship(id);
            setInternships((prev) => prev.filter((i) => i.id !== id));
            if (editing?.id === id) closeForm();
        } catch {
            setActionError({key: "postInternship.deleteGenericError"});
        }
    };

    const hasItems = !loading && !error && internships.length > 0;

    const cards = visible.map((internship) => (
        <InternshipCard key={internship.id}
                        internship={internship}
                        OnEdit={canEdit(internship) ? openEdit : undefined}
                        OnDelete={canDelete(internship) ? handleDelete : undefined}
                        dark={dark}
                        showStatusBorder={filters.status !== "ALL"}
                        applicationCount={applicationCount[internship.id]}/>
    ));

    const list = (
        <div className={s.scrollArea}>
            {loading && <p className={s.loadingText}>{t("postInternship.loading")}</p>}
            {error && <p className={s.errorText}>{translateWarning(t, error)}</p>}
            {actionError && <p className={s.errorText} role="alert">{translateWarning(t, actionError)}</p>}
            {!loading && !error && internships.length === 0 && (
                <p className={s.emptyText}>{t("postInternship.empty")}</p>
            )}
            {hasItems && visible.length === 0 && (
                <p className={s.emptyText}>{t("internshipFilters.noMatch")}</p>
            )}
            {hasItems && cards}
        </div>
    );

    return (

        <div className={s.page}>

            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("postInternship.pageTitle")}</h1>
                    <p className={s.subtitle}>{t("postInternship.pageSubtitle")}</p>
                </div>
                {!formOpen && canEditOffers && (
                    <Button tone="primary" size="lg" dark={dark} onClick={openCreate} className="shrink-0">
                        {t("postInternship.addBtn")}
                    </Button>
                )}
            </div>


            {formOpen && (
                <div ref={formRef} className="scroll-mt-20">
                    <InternshipForm
                        key={editing ? editing.id : "new"}
                        onClose={closeForm}
                        onSubmitInternship={handleSaveInternship}
                        internship={editing}
                        dark={dark}
                    />
                </div>
            )}


            <div className={s.listSection}>
                <h2 className={s.listHeading}>{t("postInternship.listTitle")}</h2>

                {hasItems && <InternshipFilters dark={dark} filters={filters} statusPage="employerInternships"/>}

                {list}
            </div>
        </div>
    );
}

export default PostInternship;
