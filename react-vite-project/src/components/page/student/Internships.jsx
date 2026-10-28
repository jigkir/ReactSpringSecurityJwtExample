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
    markInternshipsAsViewed
} from "../../api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";
import {MAX_PREVIEW_ITEMS} from '../../home/PreviewLoaders.js';
import PreviewState from '../../home/PreviewState.jsx';

// <StudentInternships />          full page (route /internship)
// <StudentInternships preview />  Home page block: the newest offers only, no header, no filters
function StudentInternships({preview = false}) {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const s = getPostInternshipClasses(dark);
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [viewError, setViewError] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [appliedInternships, setAppliedInternships] = useState([]);
    const [cvs, setCvs] = useState(null);
    const filters = useInternshipFilters(internships);
    const visible = filters.visible ?? [];
    const shown = preview ? visible.slice(0, MAX_PREVIEW_ITEMS) : visible;

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

        setSelectedId(id);

        try {
            await markInternshipsAsViewed([id]);
            setViewError(false);
            setInternships(prev => prev.map(internship => internship.id === id ? {
                ...internship,
                viewed: true
            } : internship));
        } catch {
            setViewError(true);
        }
    };

    const viewErrorLine = viewError &&
        <p className={s.errorText} role="alert">{t("studentInternship.viewedError")}</p>;

    const cards = shown.map(internship => (<InternshipCard
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
            application={appliedInternships.find((application) => application.internshipId === internship.id)}
            onChanged={loadAppliedInternships}
        />)}
    />));

    // Home preview: same states and spacing as every other Home preview
    if (preview) {
        return (
            <div className="space-y-4">
                {viewErrorLine}
                <PreviewState dark={dark} error={error} loading={loading} empty={shown.length === 0}>
                    {cards}
                </PreviewState>
            </div>
        );
    }

    const list = (
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

            {!loading && !error && cards}
        </div>
    );

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
            {viewErrorLine}

            {!loading && !error && internships.length > 0 && (<InternshipFilters
                dark={dark}
                filters={filters}
                showStatus={false}
            />)}

            {list}
        </div>
    </div>);
}

export default StudentInternships;