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
import {TARGET_TYPE, useCloseShownNotifications, useNotifications} from "../../notification/NotificationsProvider.jsx";
import {useSession} from "../../../utils/useSession.js";

// <StudentInternships />          full page (route /internship)
// <StudentInternships preview />  Home page block: the newest offers only, no header, no filters
function StudentInternships({preview = false}) {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {refresh: refreshNotifications} = useNotifications();
    const {selectedSession} = useSession();
    const s = getPostInternshipClasses(dark);
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [appliedInternships, setAppliedInternships] = useState([]);
    const [cvs, setCvs] = useState(null);
    const [letters, setLetters] = useState([]);
    const [transcripts, setTranscripts] = useState([]);
    const appliedIds = useMemo(
        () => new Set(appliedInternships.map((application) => application.internshipId)),
        [appliedInternships]);
    const filters = useInternshipFilters(internships, appliedIds);
    const visible = filters.visible ?? [];

    const shownInternshipIds = useMemo(
        () => (preview || loading ? null : internships.map((internship) => internship.id)),
        [preview, loading, internships]);
    useCloseShownNotifications(TARGET_TYPE.INTERNSHIP_OFFER, shownInternshipIds);

    const groupOf = (internship) => {
        if (appliedIds.has(internship.id)) return 1; // APPLIED
        return internship.viewed ? 2 : 0;            // OLD : NEW
    };
    const ordered = [...visible].sort((a, b) => groupOf(a) - groupOf(b));
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
        if (!selectedSession) return; // sessions still loading
        try {
            const data = await getStudentInternships(selectedSession.id);
            setInternships(data
                .filter(internship => internship.status === 'APPROVED')
                .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [selectedSession]);

    const loadAppliedInternships = useCallback(async () => {
        if (!selectedSession) return; // sessions still loading
        try {
            const data = await getStudentAppliedInternships(selectedSession.id);
            setAppliedInternships(data);
        } catch {
            setError(true);
        }
    }, [selectedSession]);

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

    const loadTranscripts = useCallback(async () => {
        try {
            const list = await getDocuments("TRANSCRIPT");
            const safe = Array.isArray(list) ? list : [];
            setTranscripts(safe);
            return safe;
        } catch {
            return [];
        }
    }, []);

    const load = useCallback(async () => {
        await Promise.all([
            loadInternships(), loadAppliedInternships(), loadCvs(), loadLetters(), loadTranscripts()
        ]);
    }, [loadInternships, loadAppliedInternships, loadCvs, loadLetters, loadTranscripts]);

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
                transcripts={transcripts}
                internshipId={internship.id}
                application={application}
                onChanged={handleApplicationChanged}
                onLettersChanged={loadLetters}
                onTranscriptsChanged={loadTranscripts}
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
            {loading && (<p className={s.loadingText} aria-busy="true">
                {t("studentInternship.loading")}
            </p>)}

            {error && (<p className={s.errorText} role="alert">
                {t("studentInternship.loadError")}
            </p>)}

            {!loading && !error && internships.length === 0 && (<p className={s.emptyText}>
                {t("studentInternship.empty")}
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