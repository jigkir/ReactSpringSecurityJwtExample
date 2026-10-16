import {useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import InternshipCard from "../internship/InternshipCard.jsx";
import ApplyControls from "./ApplyControls.jsx";
import {getStudentCvs, getStudentInternships, markInternshipAsViewed} from "../../api/Api.jsx";

function StudentInternships() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const s = getPostInternshipClasses(dark);
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [cvs, setCvs] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadInternships() {
            try {
                const data = await getStudentInternships();

                const approved = data
                    .filter(internship => internship.status === 'APPROVED')
                    .sort((a, b) =>
                        new Date(b.uploadedAt) - new Date(a.uploadedAt)
                    );

                if (!cancelled) {
                    setInternships(approved);
                }
            } catch (err) {
                console.error('Failed to load internships:', err);
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        // Only visible, approved CVs can be used to apply
        async function loadCvs() {
            try {
                const all = await getStudentCvs();
                if (!cancelled) {
                    setCvs(all.filter((cv) => cv.visibility === "VISIBLE" && cv.status === "APPROVED"));
                }
            } catch (err) {
                console.error('Failed to load CVs:', err);
                if (!cancelled) setCvs([]);
            }
        }

        loadInternships();
        loadCvs();

        return () => {
            cancelled = true;
        };
    }, []);

    const handlePreview = async (id) => {
        if (selectedId === id) {
            setSelectedId(null);
            return;
        }

        setSelectedId(selectedId === id ? null : id);

        try {
            await markInternshipAsViewed(id);

            setInternships(prev =>
                prev.map(internship =>
                    internship.id === id
                        ? {...internship, viewed: true}
                        : internship
                )
            );
        } catch (err) {
            console.error("Failed to mark internship as viewed:", err);
        }
    };

    return (
        <div className={s.page}>
            {/* Same header layout as the manager page */}
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>
                        {t("studentInternship.title")}
                    </h1>
                </div>
            </div>

            <div className={s.listSection}>
                <div className={s.scrollArea}>
                    {loading && (
                        <p className={s.loadingText}>
                            Loading internships...
                        </p>
                    )}

                    {error && (
                        <p className={s.errorText}>
                            Failed to load internships.
                        </p>
                    )}

                    {!loading && !error && internships.length === 0 && (
                        <p className={s.emptyText}>
                            No internships are currently available.
                        </p>
                    )}

                    {!loading && !error && internships.map(internship => (
                        <InternshipCard
                            key={internship.id}
                            internship={internship}
                            dark={dark}
                            showEmployer
                            hideStatus
                            showPreview
                            viewed={internship.viewed}
                            onPreview={handlePreview}
                            expanded={selectedId === internship.id}
                            bottomFooter={cvs !== null && (<ApplyControls
                                dark={dark}
                                cvs={cvs}
                                internshipId={internship.id}
                            />)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default StudentInternships;