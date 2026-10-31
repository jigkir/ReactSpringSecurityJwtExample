import {useCallback, useEffect, useRef, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import InternshipForm from './InternshipForm.jsx';
import InternshipCard from './InternshipCard.jsx';
import InternshipFilters, {useInternshipFilters} from './InternshipFilters.jsx';
import Button from '../../../styles/Button.jsx';
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
import {MAX_PREVIEW_ITEMS} from '../../home/PreviewLoaders.js';
import PreviewState from '../../home/PreviewState.jsx';

// <PostInternship user />          full page (route /internships)
// <PostInternship user preview />  Home page block: the newest offers only, read-only, no form, no filters
function PostInternship({user, preview = false}) {
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
    const shown = preview ? visible.slice(0, MAX_PREVIEW_ITEMS) : visible;

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
            setError({key: "postInternship.countError"});
        }
    }, []);

    // The application counters are only displayed on the full page
    useEffect(() => {
        if (isLoggedIn && !preview) void fetchApplicationCount();
    }, [isLoggedIn, preview, fetchApplicationCount]);

    usePolling(fetchApplicationCount, isLoggedIn && !preview)

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

    const cards = shown.map((internship) => (
        <InternshipCard key={internship.id}
                        internship={internship}
                        OnEdit={preview ? undefined : openEdit}
                        OnDelete={preview ? undefined : handleDelete}
                        dark={dark}
                        showStatusBorder={filters.status !== "ALL"}
                        applicationCount={applicationCount[internship.id]}/>
    ));

    // Home preview: same states and spacing as every other Home preview
    if (preview) {
        return (
            <PreviewState dark={dark} error={Boolean(error)} loading={loading} empty={shown.length === 0}>
                {cards}
            </PreviewState>
        );
    }

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
        // No fixed height and no inner scroll: the page scroll bar is the only one
        <div className={s.page}>
            {/* Title + button */}
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("postInternship.pageTitle")}</h1>
                    <p className={s.subtitle}>{t("postInternship.pageSubtitle")}</p>
                </div>
                {!formOpen && (
                    <Button tone="primary" size="lg" dark={dark} onClick={openCreate} className="shrink-0">
                        {t("postInternship.addBtn")}
                    </Button>
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

                {list}
            </div>
        </div>
    );
}

export default PostInternship;