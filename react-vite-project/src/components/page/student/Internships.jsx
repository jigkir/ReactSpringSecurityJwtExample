import {useCallback, useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import InternshipCard from "../internship/InternshipCard.jsx";
import InternshipFilters, {useInternshipFilters} from '../internship/InternshipFilters.jsx';
import ApplyControls from "./ApplyControls.jsx";
import {
    getStudentAppliedInternships,
    getStudentCvs,
    getStudentInternships,
    markInternshipAsViewed
} from "../../api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";

function StudentInternships() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const s = getPostInternshipClasses(dark);
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [appliedInternships, setAppliedInternships] = useState([]);
    const [cvs, setCvs] = useState(null);
    const filters = useInternshipFilters(internships);
    const visible = filters.visible ?? [];

    const loadInternships = useCallback(async () => {
        try {
            const data = await getStudentInternships();
            setInternships(data
                .filter(internship => internship.status === 'APPROVED')
                .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadAppliedInternships = useCallback(async () => {
        try {
            const data = await getStudentAppliedInternships();
            setAppliedInternships(data);
        } catch {
            setError(true);
        }
    }, []);

    // Only visible, approved CVs can be used to apply
    const loadCvs = useCallback(async () => {
        try {
            const all = await getStudentCvs();
            setCvs(all.filter((cv) => cv.visibility === "VISIBLE" && cv.status === "APPROVED"));
        } catch {
            setCvs([]);
        }
    }, []);

    const load = useCallback(async () => {
        await Promise.all([loadInternships(), loadAppliedInternships(), loadCvs()]);
    }, [loadInternships, loadAppliedInternships, loadCvs]);

    useEffect(() => {
        void load();
    }, [load]);

    usePolling(load);

    const handlePreview = async (id) => {
        if (selectedId === id) {
            setSelectedId(null);
            return;
        }

        setSelectedId(selectedId === id ? null : id);

        try {
            await markInternshipAsViewed(id);

            setInternships(prev => prev.map(internship => internship.id === id ? {
                ...internship,
                viewed: true
            } : internship));
        } catch (err) {
            console.error("Failed to mark internship as viewed:", err);
        }
    };

    return (<div className={s.page}>
        {/* Same header layout as the manager page */}
        <div className={s.headerSection}>
            <div>
                <h1 className={s.title}>
                    {t("studentInternship.title")}
                </h1>
            </div>
        </div>

        <div className={s.listSection}>
            {!loading && !error && internships.length > 0 && (<InternshipFilters
                dark={dark}
                filters={filters}
                showStatus={false}
            />)}

            <div className={s.scrollArea}>
                {loading && (<p className={s.loadingText}>
                    Loading internships...
                </p>)}

                {error && (<p className={s.errorText}>
                    Failed to load internships.
                </p>)}

                {!loading && !error && internships.length === 0 && (<p className={s.emptyText}>
                    No internships are currently available.
                </p>)}

                {!loading && !error && internships.length > 0 && visible.length === 0 && (
                    <p className={s.emptyText}>
                        {t("internshipFilters.noMatch")}
                    </p>
                )}

                {!loading && !error && visible.map(internship => (<InternshipCard
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
                        application={appliedInternships.filter((application) => application.internshipId === internship.id)}
                    />)}
                />))}
            </div>
        </div>
    </div>);
}

export default StudentInternships;