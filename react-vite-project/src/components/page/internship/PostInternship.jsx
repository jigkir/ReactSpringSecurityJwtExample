import {useCallback, useEffect, useRef, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import InternshipForm from './InternshipForm.jsx';
import InternshipCard from './InternshipCard.jsx';
import InternshipFilters, {useInternshipFilters} from './InternshipFilters.jsx';
import {translateWarning} from '../../../utils/CommonFields.jsx';
import {getPostInternshipClasses} from '../../../styles/AppStyles.jsx';
import {
    createInternship,
    deleteInternship,
    getApplicationCount,
    getEmployerInternships,
    updateInternship
} from '../../api/Api.jsx';
import {usePolling} from "../../../utils/usePolling.js";

function PostInternship({user}) {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [internships, setInternships] = useState([]);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [loading, setLoading] = useState(true);
    const [applicationCount, setApplicationCount] = useState({})
    const formRef = useRef(null);

    const s = getPostInternshipClasses(dark);
    const filters = useInternshipFilters(internships);
    const visible = filters.visible ?? [];

    const isLoggedIn = Boolean(user?.isLoggedIn);

    const load = useCallback(async () => {
        try {
            setInternships(await getEmployerInternships());
            setError("");
        } catch {
            setError({key: "postInternship.loadError"});
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchApplicationCount = useCallback(async () => {
        try {
            const countData = await getApplicationCount();
            setApplicationCount(countData);
        } catch {
            setError({key: "postInternship.countError:"});
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) void fetchApplicationCount();
    }, [isLoggedIn, fetchApplicationCount]);

    usePolling(fetchApplicationCount, isLoggedIn)

    useEffect(() => {
        if (isLoggedIn) void load();
    }, [isLoggedIn, load]);

    usePolling(load, isLoggedIn);

    // Bring the inline form into view (page scroll only) when it opens
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

    // Create or update depending on `editing`
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

    return (
        // No fixed height and no inner scroll: the page scroll bar is the only one
        <div className={s.page}>
            {/* Title + button */}
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("postInternship.pageTitle")}</h1>
                    <p className={s.subtitle}>{t("postInternship.pageSubtitle")}</p>
                </div>
                {!formOpen && (
                    <button onClick={openCreate} className={s.addBtn}>
                        {t("postInternship.addBtn")}
                    </button>
                )}
            </div>

            {/* Inline create / edit form: between the title and the sort bar */}
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

            {/* Internship list */}
            <div className={s.listSection}>
                <h2 className={s.listHeading}>{t("postInternship.listTitle")}</h2>

                {hasItems && <InternshipFilters dark={dark} filters={filters}/>}

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
                    {hasItems && visible.map((internship) => (
                        <InternshipCard key={internship.id}
                                        internship={internship}
                                        OnEdit={openEdit}
                                        OnDelete={handleDelete}
                                        dark={dark}
                                        showStatusBorder={filters.status !== "ALL"}
                                        applicationCount={applicationCount[internship.id]}/>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PostInternship;