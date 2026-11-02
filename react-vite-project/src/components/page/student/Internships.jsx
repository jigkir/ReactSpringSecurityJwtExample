import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import InternshipCard from "../internship/InternshipCard.jsx";
import InternshipFilters, {useInternshipFilters} from '../internship/InternshipFilters.jsx';
import ApplyControls from "./ApplyControls.jsx";
import {
    getDocuments,
    getStudentAppliedInternships,
    getStudentCvs,
    getStudentInternships,
    markInternshipsAsViewed
} from "../../api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";
import {MAX_PREVIEW_ITEMS} from '../../home/PreviewLoaders.js';
import PreviewState from '../../home/PreviewState.jsx';
import {useNotifications} from "../../notification/NotificationsProvider.jsx";

// <StudentInternships />          full page (route /internship)
// <StudentInternships preview />  Home page block: the newest offers only, no header, no filters
function StudentInternships({preview = false}) {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {refresh: refreshNotifications} = useNotifications();
    const s = getPostInternshipClasses(dark);
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [appliedInternships, setAppliedInternships] = useState([]);
    const [cvs, setCvs] = useState(null);
    const [letters, setLetters] = useState([]);
    const appliedIds = useMemo(
        () => new Set(appliedInternships.map((application) => application.internshipId)),
        [appliedInternships]);
    const filters = useInternshipFilters(internships, appliedIds);
    const visible = filters.visible ?? [];
    const ordered = [...visible].sort((a, b) =>
        Number(appliedIds.has(b.id)) - Number(appliedIds.has(a.id))
        || Number(Boolean(a.viewed)) - Number(Boolean(b.viewed)));
    const shown = preview ? ordered.slice(0, MAX_PREVIEW_ITEMS) : ordered;

    const unviewedIdsRef = useRef([]);
    useEffect(() => {
        unviewedIdsRef.current = shown.filter((i) => !i.viewed).map((i) => i.id);
    });

    useEffect(() => () => {
        const ids = unviewedIdsRef.current;
        if (ids.length > 0) Promise.resolve(markInternshipsAsViewed(ids)).catch(() => {
        });
    }, []);

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

    // Cover letters are optional: a failure just means an empty list
    const loadLetters = useCallback(async () => {
        try {
            const list = await getDocuments("COVER_LETTER");
            const safe = Array.isArray(list) ? list : [];
            setLetters(safe);
            return safe;
        } catch {
            return [];
        }
    }, []);

    const load = useCallback(async () => {
        await Promise.all([loadInternships(), loadAppliedInternships(), loadCvs(), loadLetters()]);
    }, [loadInternships, loadAppliedInternships, loadCvs, loadLetters]);

    // Applying closes the offer's notification, even from the Home preview
    const handleApplicationChanged = useCallback(async () => {
        await loadAppliedInternships();
        void refreshNotifications();
    }, [loadAppliedInternships, refreshNotifications]);

    useEffect(() => {
        void load();
    }, [load]);

    usePolling(load);

    const cards = shown.map(internship => {
        const application = appliedInternships.find((a) => a.internshipId === internship.id);

        return (<InternshipCard
            key={internship.id}
            internship={internship}
            dark={dark}
            showEmployer
            hideStatus
            showPreview
            viewed={internship.viewed}
            application={application}
            bottomFooter={cvs !== null && (<ApplyControls
                dark={dark}
                cvs={cvs}
                letters={letters}
                internshipId={internship.id}
                application={application}
                onChanged={handleApplicationChanged}
                onLettersChanged={loadLetters}
            />)}
        />);
    });

    // Home preview: same states and spacing as every other Home preview
    if (preview) {
        return (
            <div className="space-y-4">
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
            {!loading && !error && internships.length > 0 && (<InternshipFilters
                dark={dark}
                filters={filters}
                showStatus={false}
                showApplied
            />)}

            {list}
        </div>
    </div>);
}

export default StudentInternships;