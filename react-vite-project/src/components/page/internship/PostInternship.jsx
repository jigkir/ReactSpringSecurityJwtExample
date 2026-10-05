import {useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import InternshipModal from './InternshipModal.jsx';
import InternshipCard from './InternshipCard.jsx';
import InternshipFilters, {useInternshipFilters} from './InternshipFilters.jsx';
import {translateWarning} from '../../../utils/CommonFields.jsx';
import {getPostInternshipClasses} from '../../../styles/AppStyles.jsx';
import {createInternship, deleteInternship, getEmployerInternships, updateInternship} from '../../api/Api.jsx';

function PostInternship({user}) {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [internships, setInternships] = useState([]);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [loading, setLoading] = useState(true);

    const s = getPostInternshipClasses(dark);
    const filters = useInternshipFilters(internships);
    const visible = filters.visible ?? [];

    useEffect(() => {
        if (!user?.isLoggedIn) return;
        getEmployerInternships()
            .then(setInternships)
            .catch(() => setError({key: "postInternship.loadError"}))
            .finally(() => setLoading(false));
    }, [user?.isLoggedIn]);

    const openCreate = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (internship) => {
        setEditing(internship);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
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
        } catch {
            setActionError({key: "postInternship.deleteGenericError"});
        }
    };

    const hasItems = !loading && !error && internships.length > 0;

    return (
        // 1. Outer page locks to the screen height with no page scrolling
        <div className={s.page}>
            {/* Top Header & Button Section */}
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("postInternship.pageTitle")}</h1>
                    <p className={s.subtitle}>{t("postInternship.pageSubtitle")}</p>
                </div>
                <button onClick={openCreate} className={s.addBtn}>
                    {t("postInternship.addBtn")}
                </button>
            </div>

            {/* Internship List Section */}
            <div className={s.listSection}>
                <h2 className={s.listHeading}>{t("postInternship.listTitle")}</h2>

                {hasItems && <InternshipFilters dark={dark} filters={filters}/>}

                {/* 2. Scrollable container for the cards */}

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
                                        dark={dark}/>
                    ))}
                </div>
            </div>

            {/* Create / edit modal */}
            <InternshipModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmitInternship={handleSaveInternship}
                internship={editing}
                dark={dark}
            />
        </div>
    );
}

export default PostInternship;