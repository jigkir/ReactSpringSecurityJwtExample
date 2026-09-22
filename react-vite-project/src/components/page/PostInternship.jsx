import {useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import InternshipModal from '../InternshipModal.jsx';
import InternshipCard from '../InternshipCard.jsx';
import fetcher from '../../utils/fetcher.js';
import {getPostInternshipClasses} from '../../styles/appStyles.jsx';

function PostInternship({user}) {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [internships, setInternships] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const s = getPostInternshipClasses(dark);

    useEffect(() => {
        fetcher("internship/made", {})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.internships ?? []);
                setInternships(list);
            })
            .catch(() => setError(t("postInternship.loadError")))
            .finally(() => setLoading(false));
    }, [t]);

    const handleAddInternship = async (newOffer) => {
        try {
            const response = await fetcher("internship/make", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(newOffer),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t("postInternship.createError"));
            }

            const savedInternship = await response.json();

            // Prepend the newly created internship (InternshipResponseDto) to the list
            setInternships((prev) => [savedInternship, ...prev]);
            return {success: true};
        } catch (err) {
            console.error(err);
            return {success: false, message: err.message || t("postInternship.createGenericError")};
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetcher(`internship/delete?id=${id}`, {method: "PUT"});
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t("postInternship.deleteError"));
            }
            const updatedInternship = await response.json();
            setInternships((prev) =>
                prev.map((i) => (i.id === id ? {...updatedInternship, isDeleted: true} : i))
            );
        } catch (err) {
            console.error(err);
            alert(err.message || t("postInternship.deleteGenericError"));
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
                    {!loading && !error && internships.filter((i) => !i.isDeleted).length === 0 && (
                        <p className={s.emptyText}>{t("postInternship.empty")}</p>
                    )}
                    {!loading && !error && internships.map((internship) =>
                            !internship.isDeleted && (
                                <InternshipCard
                                    key={internship.id}
                                    internship={internship}
                                    OnDelete={handleDelete}
                                    dark={dark}
                                />
                            )
                    )}
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