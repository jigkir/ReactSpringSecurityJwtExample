import {useTranslation} from 'react-i18next';
import {getInternshipCardClasses} from '../styles/appStyles.jsx';

const STATUS_KEY_MAP = {
    "Pending Validation": "internshipCard.status.pendingValidation",
    "Approved": "internshipCard.status.approved",
    "Rejected": "internshipCard.status.rejected",
};

export default function InternshipCard({internship, OnDelete, dark}) {
    const {t} = useTranslation();
    const s = getInternshipCardClasses(dark);

    const statusLabel = STATUS_KEY_MAP[internship.status]
        ? t(STATUS_KEY_MAP[internship.status])
        : internship.status;

    return (
        <div className={s.card}>
            {/* Top row */}
            <div className={s.topRow}>
                <div>
                    <h3 className={s.title}>{internship.title}</h3>
                    <p className={s.description}>{internship.description}</p>
                </div>
                <span className={s.statusBadge(internship.status)}>
                    {internship.status === "Pending Validation" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    ) : internship.status === "Approved" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    )}
                    {statusLabel}
                </span>
            </div>

            {/* Required Skills */}
            <div className={s.skillsRow}>
                <span className="font-semibold">{t("internshipCard.requiredSkills")} </span>
                <span className={s.skillBadge}>{internship.requiredSkills}</span>
            </div>

            {/* Detail badges */}
            <div className={s.detailsRow}>
                {/* Location */}
                <span className={s.detailBadge}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
                    </svg>
                    {internship.location}
                </span>

                {/* Duration */}
                <span className={s.detailBadge}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                    {internship.duration}
                </span>

                {/* Compensation */}
                <span className={s.detailBadge}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                    </svg>
                    {internship.compensation}
                </span>

                {/* Start date */}
                <span className={s.detailBadge}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
                    </svg>
                    {internship.startDate}
                </span>

                {/* Deadline */}
                <span className={s.detailBadge}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6v3m0 3h.008v.008H12v-.008Z"/>
                    </svg>
                    {internship.deadline}
                </span>

                {/* Delete */}
                <button
                    className={s.deleteBtn}
                    aria-label={t("internshipCard.deleteAria")}
                    onClick={() => OnDelete(internship.id)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}