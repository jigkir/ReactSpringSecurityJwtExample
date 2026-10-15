import {useEffect, useRef, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses, getInternshipCardClasses} from '../../../styles/AppStyles.jsx';
import fetcher from "../../../utils/fetcher.js";
import InternshipForm from "./InternshipForm.jsx";

function Internship() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);
    const cardClasses = getInternshipCardClasses(dark);
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [appliedId, setAppliedId] = useState(null);
    const formRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function loadInternships() {
            try {
                const response = await fetcher('student/internship');

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

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



        loadInternships();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (appliedId != null) formRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
    }, [appliedId]);

    return (
        <div className={classes.page}>
            <h1 className={classes.heading}>
                {t('studentInternship.title')}
            </h1>

            {loading && <p>Loading internships...</p>}

            {error && (
                <p className="text-red-500">
                    Failed to load internships.
                </p>
            )}

            {!loading && !error && internships.length === 0 && (
                <p>No internships are currently available.</p>
            )}
            {!loading && !error && appliedId != null && (
                <div ref={formRef} className="scroll-mt-20">
                    <InternshipForm
                        dark={dark}
                    />
                </div>
            )}
            {!loading && !error && (


                <div className="space-y-4 max-w-5xl">
                    {internships.map(internship => (
                        <div
                            key={internship.id}
                            className={cardClasses.card}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    className="flex-1 min-w-0 text-left cursor-pointer"
                                    aria-expanded={selectedId === internship.id}
                                    onClick={() => setSelectedId(
                                        selectedId === internship.id
                                            ? null
                                            : internship.id
                                    )}
                                >
                                    <h2 className={cardClasses.title}>
                                        {internship.title}
                                    </h2>

                                    <p>{internship.employerEmail}</p>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className={cardClasses.detailBadge}>
                                            {internship.location}
                                        </span>

                                        <span className={cardClasses.detailBadge}>
                                            {internship.workMode}
                                        </span>

                                        <span className={cardClasses.detailBadge}>
                                            {internship.durationInWeeks} weeks
                                        </span>

                                        <span className={cardClasses.detailBadge}>
                                            {internship.compensationAmount != null
                                                ? `${internship.compensationAmount} $`
                                                : internship.compensationNegotiable
                                                    ? 'Negotiable'
                                                    : 'Not specified'}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-indigo-500">
                                        {selectedId === internship.id
                                            ? 'Hide details'
                                            : 'View details'}
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAppliedId(
                                        appliedId === internship.id
                                            ? null
                                            : internship.id
                                    )}
                                    className={cardClasses.signupBtn}
                                >Apply</button>
                            </div>
                            {selectedId === internship.id && (
                                <div className="border-t pt-4 mt-4 space-y-3">
                                    <p className="whitespace-pre-wrap break-words">
                                        {internship.description}
                                    </p>

                                    <p><strong>Skills:</strong> {internship.requiredSkills}</p>
                                    <p><strong>Start date:</strong> {internship.startDate}</p>
                                    <p><strong>Application deadline:</strong> {internship.applicationDeadline}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Internship;