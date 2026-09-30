import {useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import InternshipModal from './InternshipModal.jsx';
import InternshipCard from './InternshipCard.jsx';
import fetcher from '../../../utils/fetcher.js';
import {getPostInternshipClasses} from '../../../styles/appStyles.jsx';
import {getEmployerInternships, createInternship, deleteInternship} from '../../api/Api.jsx';

function PostInternship({user}) {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [internships, setInternships] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const s = getPostInternshipClasses(dark);

    useEffect(() => {
        if (!user?.id) return;
        getEmployerInternships(user.id)
            .then(setInternships)
            .catch(() => setError(t("postInternship.loadError")))
            .finally(() => setLoading(false));
    }, [user?.id, t]);

    const handleAddInternship = async (newInternship) => {
        try {
            const savedInternship = await createInternship(newInternship);
            setInternships((prev) => [savedInternship, ...prev]);
            return {success: true};
        } catch (err) {
            const fieldErrors = Object.entries(err.body ?? {}).filter(([field]) => field !== "message").map(([field, message]) => `${field}: ${message}`).join("\n");
            return {success: false, message: err.body?.message || fieldErrors || t("postInternship.createGenericError")};
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteInternship(id);
            setInternships((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            alert(err.body?.message || t("postInternship.deleteGenericError"));
        }
    };

    return (
        // 1. Outer page locks to the screen height with no page scrolling
        <div className={s.page}>
            {/* Top Header & Button Section */}
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("postInternship.pageTitle")}</h1>
                    <p className={s.subtitle}>{t("postInternship.pageSubtitle")}</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className={s.addBtn}>
                    {t("postInternship.addBtn")}
                </button>
            </div>

            {/* Internship List Section (Takes up remaining height) */}
            <div className={s.listSection}>
                <h2 className={s.listHeading}>{t("postInternship.listTitle")}</h2>

                {/* 2. Scrollable container for the cards */}
                <div className={s.scrollArea}>
                    {loading && <p className={s.loadingText}>{t("postInternship.loading")}</p>}
                    {error && <p className={s.errorText}>{error}</p>}
                    {!loading && !error && internships.length === 0 && (
                        <p className={s.emptyText}>{t("postInternship.empty")}</p>
                    )}
                    {!loading && !error && internships.map((internship) => (
                        <InternshipCard key={internship.id}
                                        internship={internship}
                                        OnDelete={handleDelete}
                                        dark={dark}/>
                    ))}
                </div>
            </div>

            {/* Modal Component */}
            <InternshipModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddInternship={handleAddInternship}
                user={user}
                dark={dark}
            />
        </div>
    );
}

export default PostInternship;